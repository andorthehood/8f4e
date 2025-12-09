import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import wabt from 'wabt';

import { FunctionBody } from '../../src/wasmUtils/typeHelpers';
import { compileToAST } from '../../src/compiler';
import {
	createCodeSection,
	createExportSection,
	createFunctionExport,
	createFunctionSection,
	createFunctionType,
	createImportSection,
	createMemoryImport,
	createTypeSection,
} from '../../src/wasmUtils/sectionHelpers';
import { compileModules } from '../../src';
import compile from '../../src/index';

import type { CompiledModule, TestModule, MemoryBuffer, Module } from '../../src/types';

// Extended memory buffer interface for testing
interface ExtendedMemoryBuffer {
	get: (id: string) => number | number[] | undefined;
	set: (id: string, value: number | number[]) => void;
	[index: number]: number;
	length: number;
}

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

export function getInitialMemory(module: CompiledModule): number[] {
	return Object.values(module.memoryMap).reduce((accumulator, current) => {
		if (typeof current.default === 'object') {
			const defaultBuffer = new Array(current.wordAlignedSize);
			defaultBuffer.fill(0);

			Object.entries(current.default).forEach(([relativeWordAddress, value]) => {
				defaultBuffer[value] = parseInt(relativeWordAddress, 10);
			});

			accumulator = accumulator.concat(defaultBuffer);
		} else {
			accumulator.push(current.default || 0);
		}
		return accumulator;
	}, [] as number[]);
}

export function createSingleFunctionWASMProgram(functionBody: FunctionBody): Uint8Array {
	return Uint8Array.from([
		...HEADER,
		...VERSION,
		...createTypeSection([createFunctionType([], [])]),
		...createImportSection([createMemoryImport('js', 'memory')]),
		...createFunctionSection([0x00]),
		...createExportSection([createFunctionExport('test', 0x00)]),
		...createCodeSection([functionBody]),
	]);
}

export function setInitialMemory(memory: DataView, module: CompiledModule): void {
	const initialMemory = getInitialMemory(module);
	for (let i = 0; i < initialMemory.length; i++) {
		if (Number.isInteger(initialMemory[i])) {
			memory.setInt32(i * 4, initialMemory[i], true);
		} else {
			memory.setFloat32(i * 4, initialMemory[i], true);
		}
	}
}

export async function createTestModule(sourceCode: string): Promise<TestModule> {
	const ast = compileToAST(sourceCode.split('\n'));
	const module: CompiledModule = compileModules([ast], {
		environmentExtensions: { constants: {}, ignoredKeywords: [] },
		startingMemoryWordAddress: 0,
		memorySizeBytes: 65536,
		includeAST: true,
	})[0];
	const program = createSingleFunctionWASMProgram(module.loopFunction);
	const memoryRef = new WebAssembly.Memory({ initial: 1 });
	const dataView = new DataView(memoryRef.buffer);
	const memoryBuffer = new Int32Array(memoryRef.buffer);
	let instance: WebAssembly.Instance | undefined;
	let wat = '';

	try {
		const webAssemblyInstantiatedSource = (await WebAssembly.instantiate(program, {
			js: {
				memory: memoryRef,
			},
		})) as unknown as WebAssembly.WebAssemblyInstantiatedSource;
		instance = webAssemblyInstantiatedSource.instance;

		wat = await new Promise(resolve => {
			wabt().then(_wabt => {
				const module = _wabt.readWasm(program, {});
				resolve(module.toText({}));
			});
		});
	} catch (error) {
		console.log(error);
	}

	const reset = () => {
		setInitialMemory(dataView, module);
	};

	reset();

	const test = (instance?.exports.test ||
		function () {
			return;
		}) as CallableFunction;

	const memoryGet = (id: string): number | undefined => {
		const memoryItem = module.memoryMap[id];

		if (!memoryItem) {
			return;
		}

		if (memoryItem.isInteger) {
			return dataView.getInt32(memoryItem.byteAddress, true);
		} else {
			return dataView.getFloat32(memoryItem.byteAddress, true);
		}
	};

	const memorySet = (id: string, value: number | number[]): void => {
		const memoryItem = module.memoryMap[id];
		if (!memoryItem) {
			return;
		}

		if (typeof value === 'number') {
			if (Number.isInteger(value)) {
				dataView.setInt32(memoryItem.byteAddress, value, true);
			} else {
				dataView.setFloat32(memoryItem.byteAddress, value, true);
			}
		} else {
			for (let i = 0; i < value.length; i++) {
				if (Number.isInteger(value[i])) {
					dataView.setInt32(memoryItem.byteAddress + i * 4, value[i], true);
				} else {
					dataView.setFloat32(memoryItem.byteAddress + i * 4, value[i], true);
				}
			}
		}
		return;
	};

	(memoryBuffer as unknown as ExtendedMemoryBuffer).get = memoryGet;
	(memoryBuffer as unknown as ExtendedMemoryBuffer).set = memorySet;

	return {
		memory: memoryBuffer as unknown as MemoryBuffer & {
			get: (address: number | string) => number;
			byteAddress: (address: number | string) => number;
			set: (address: number | string, value: number | number[]) => void;
			allocMemoryForPointer: (address: number | string) => number;
		},
		test,
		reset,
		wat,
		program,
		memoryMap: module.memoryMap,
		ast: module.ast || ast,
	};
}

export function moduleTester(
	description: string,
	moduleCode: string,
	...tests: [inputs: Record<string, number>, outputs: Record<string, number>][][]
) {
	describe(description, () => {
		let testModule: TestModule;

		beforeAll(async () => {
			testModule = await createTestModule(moduleCode);
		});

		beforeEach(() => {
			testModule.reset();
		});

		test('if the generated AST, WAT and memory map match the snapshot', () => {
			expect(testModule.ast).toMatchSnapshot();
			expect(testModule.wat).toMatchSnapshot();
			expect(testModule.memoryMap).toMatchSnapshot();
		});

		test.each(tests)('testing sequence of inputs: %p', (...fixtures) => {
			const { memory, test } = testModule;

			fixtures.forEach(([inputs, outputs]) => {
				Object.entries(inputs).forEach(([key, value]) => {
					memory.set(key, value);
				});

				test();

				Object.entries(outputs).forEach(([key, value]) => {
					expect(memory.get(key)).toBeCloseTo(value);
				});
			});
		});
	});
}

export async function createTestModuleWithFunctions(moduleCode: string, functionCodes?: string[]): Promise<TestModule> {
	const modules: Module[] = [{ code: moduleCode.split('\n') }];
	const functions: Module[] | undefined = functionCodes?.map(code => ({ code: code.split('\n') }));

	const result = compile(
		modules,
		{
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			startingMemoryWordAddress: 0,
			memorySizeBytes: 65536,
			includeAST: true,
		},
		functions
	);

	const module = result.compiledModules[Object.keys(result.compiledModules)[0]];
	const program = result.codeBuffer;
	const memoryRef = new WebAssembly.Memory({ initial: 1 });
	const dataView = new DataView(memoryRef.buffer);
	const memoryBuffer = new Int32Array(memoryRef.buffer);
	let instance: WebAssembly.Instance | undefined;
	let wat = '';

	try {
		const webAssemblyInstantiatedSource = (await WebAssembly.instantiate(program, {
			js: {
				memory: memoryRef,
			},
		})) as unknown as WebAssembly.WebAssemblyInstantiatedSource;
		instance = webAssemblyInstantiatedSource.instance;

		wat = await new Promise(resolve => {
			wabt().then(_wabt => {
				const wasmModule = _wabt.readWasm(program, {});
				resolve(wasmModule.toText({}));
			});
		});
	} catch (error) {
		console.log(error);
	}

	const reset = () => {
		setInitialMemory(dataView, module);
	};

	reset();

	// Call init to initialize memory
	const init = (instance?.exports.init ||
		function () {
			return;
		}) as CallableFunction;
	init();

	const cycle = (instance?.exports.cycle ||
		function () {
			return;
		}) as CallableFunction;

	const memoryGet = (id: string): number | undefined => {
		const memoryItem = module.memoryMap[id];

		if (!memoryItem) {
			return;
		}

		if (memoryItem.isInteger) {
			return dataView.getInt32(memoryItem.byteAddress, true);
		} else {
			return dataView.getFloat32(memoryItem.byteAddress, true);
		}
	};

	const memorySet = (id: string, value: number | number[]): void => {
		const memoryItem = module.memoryMap[id];
		if (!memoryItem) {
			return;
		}

		if (typeof value === 'number') {
			if (Number.isInteger(value)) {
				dataView.setInt32(memoryItem.byteAddress, value, true);
			} else {
				dataView.setFloat32(memoryItem.byteAddress, value, true);
			}
		} else {
			for (let i = 0; i < value.length; i++) {
				if (Number.isInteger(value[i])) {
					dataView.setInt32(memoryItem.byteAddress + i * 4, value[i], true);
				} else {
					dataView.setFloat32(memoryItem.byteAddress + i * 4, value[i], true);
				}
			}
		}
		return;
	};

	(memoryBuffer as unknown as ExtendedMemoryBuffer).get = memoryGet;
	(memoryBuffer as unknown as ExtendedMemoryBuffer).set = memorySet;

	return {
		memory: memoryBuffer as unknown as MemoryBuffer & {
			get: (address: number | string) => number;
			byteAddress: (address: number | string) => number;
			set: (address: number | string, value: number | number[]) => void;
			allocMemoryForPointer: (address: number | string) => number;
		},
		test: cycle,
		reset,
		wat,
		program,
		memoryMap: module.memoryMap,
		ast: module.ast || result.compiledModules[Object.keys(result.compiledModules)[0]].ast!,
	};
}

export function moduleTesterWithFunctions(
	description: string,
	moduleCode: string,
	functionCodes: string[],
	...tests: [inputs: Record<string, number>, outputs: Record<string, number>][][]
) {
	describe(description, () => {
		let testModule: TestModule;

		beforeAll(async () => {
			testModule = await createTestModuleWithFunctions(moduleCode, functionCodes);
		});

		beforeEach(() => {
			testModule.reset();
		});

		test('if the generated AST, WAT and memory map match the snapshot', () => {
			expect(testModule.ast).toMatchSnapshot();
			expect(testModule.wat).toMatchSnapshot();
			expect(testModule.memoryMap).toMatchSnapshot();
		});

		test.each(tests)('testing sequence of inputs: %p', (...fixtures) => {
			const { memory, test } = testModule;

			fixtures.forEach(([inputs, outputs]) => {
				Object.entries(inputs).forEach(([key, value]) => {
					memory.set(key, value);
				});

				test();

				Object.entries(outputs).forEach(([key, value]) => {
					expect(memory.get(key)).toBeCloseTo(value);
				});
			});
		});
	});
}

export function expectModuleToThrow(description: string, moduleCode: string, errorMessage: string) {
	describe(description, () => {
		test('throws', async () => {
			expect(async () => createTestModule(moduleCode)).toThrow(errorMessage);
		});
	});
}
