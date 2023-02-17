import wabt from 'wabt';

import {
	createCodeSection,
	createExportSection,
	createFunctionExport,
	createFunctionSection,
	createFunctionType,
	createImportSection,
	createMemoryImport,
	createTypeSection,
} from './wasmUtils/sectionHelpers';
import { FunctionBody } from './wasmUtils/typeHelpers';
import { CompiledModule, TestModule } from './types';
import { WORD_LENGTH } from './consts';

import { compileModules, getInitialMemory } from '.';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

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

export function setInitialMemory(memory: Int32Array, module: CompiledModule): void {
	const initialMemory = getInitialMemory(module);
	for (let i = 0; i < initialMemory.length; i++) {
		memory[i] = initialMemory[i];
	}
}

export async function createTestModule(sourceCode: string): Promise<TestModule> {
	let allocatedMemoryForTestData = 0;

	const module: CompiledModule = compileModules([{ code: sourceCode.split('\n') }])[0];
	const program = createSingleFunctionWASMProgram(module.functionBody);

	const memoryRef = new WebAssembly.Memory({ initial: 1 });
	const memoryBuffer = new Int32Array(memoryRef.buffer);

	const { instance } = await WebAssembly.instantiate(program, {
		js: {
			memory: memoryRef,
		},
	});

	const reset = () => {
		setInitialMemory(memoryBuffer, module);

		// Clear the test data that was out of the module's scope.
		for (let i = module.memoryWordSize; i < module.memoryWordSize + allocatedMemoryForTestData; i++) {
			memoryBuffer[i] = 0;
		}
		allocatedMemoryForTestData = 0;
	};

	reset();

	const test = instance.exports.test as CallableFunction;

	const wat: string = await new Promise(resolve => {
		wabt().then(_wabt => {
			const module = _wabt.readWasm(program, {});
			resolve(module.toText({}));
		});
	});

	const memoryGet = (address: string | number): number | undefined => {
		if (typeof address === 'string') {
			const memoryItem = module.memoryMap.get(address);

			if (!memoryItem) {
				return;
			}

			return memoryBuffer[memoryItem.relativeWordAddress];
		}
		return memoryBuffer[address];
	};

	const memorySet = (address: string | number, value: number | number[]): void => {
		if (typeof address === 'string') {
			const memoryItem = module.memoryMap.get(address);
			if (!memoryItem) {
				return;
			}

			if (typeof value === 'number') {
				memoryBuffer[memoryItem.relativeWordAddress] = value;
			} else {
				for (let i = 0; i < value.length; i++) {
					memoryBuffer[memoryItem.relativeWordAddress + i] = value[i];
				}
			}
			return;
		}

		if (typeof value === 'number') {
			memoryBuffer[address] = value;
		} else {
			for (let i = 0; i < value.length; i++) {
				memoryBuffer[address] = value[i];
			}
		}
	};

	const getByteAddress = (address: string | number): number | undefined => {
		if (typeof address === 'string') {
			const memoryItem = module.memoryMap.get(address);
			if (!memoryItem) {
				return;
			}

			return memoryItem.byteAddress;
		}

		return address * WORD_LENGTH;
	};

	const allocMemoryForPointer = (address: string | number): number => {
		const firstFreeAddress = module.memoryWordSize + allocatedMemoryForTestData;
		memorySet(address, firstFreeAddress * WORD_LENGTH);
		allocatedMemoryForTestData++;
		return firstFreeAddress;
	};

	// @ts-ignore
	memoryBuffer.get = memoryGet;
	// @ts-ignore
	memoryBuffer.set = memorySet;
	// @ts-ignore
	memoryBuffer.allocMemoryForPointer = allocMemoryForPointer;
	// @ts-ignore
	memoryBuffer.byteAddress = getByteAddress;

	return {
		// @ts-ignore
		memory: memoryBuffer,
		test,
		reset,
		wat,
		program,
		memoryMap: module.memoryMap,
		ast: module.ast,
	};
}
