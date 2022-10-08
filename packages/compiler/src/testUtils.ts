import {
	FunctionBody,
	createCodeSection,
	createExportSection,
	createFunctionExport,
	createFunctionSection,
	createFunctionType,
	createImportSection,
	createMemoryImport,
	createTypeSection,
} from '@8f4e/bytecode-utils';
import wabt from 'wabt';

import { compile } from './compiler';
import { CompiledModule, TestModule } from './types';

import { getInitialMemory } from '.';

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
	const module: CompiledModule = compile(sourceCode, 'test', 0);
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
	};

	reset();

	const test = instance.exports.test as CallableFunction;

	const wat: string = await new Promise(resolve => {
		wabt().then(_wabt => {
			const module = _wabt.readWasm(program, {});
			resolve(module.toText({}));
		});
	});

	const memoryGet = (address: string | number, offset = 0): number => {
		if (typeof address === 'string') {
			return memoryBuffer[module.memoryMap.get(address).address + offset];
		}
		return memoryBuffer[address + offset];
	};

	const memorySet = (address: string | number, value: number, offset = 0): void => {
		if (typeof address === 'string') {
			memoryBuffer[module.memoryMap.get(address).address + offset] = value;
			return;
		}

		memoryBuffer[address + offset] = value;
	};

	return {
		memory: memoryBuffer,
		test,
		reset,
		wat,
		program,
		memoryMap: module.memoryMap,
		memoryGet,
		memorySet,
	};
}
