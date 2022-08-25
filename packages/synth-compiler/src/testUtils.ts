import {
	createFunctionSection,
	createTypeSection,
	createFunctionType,
	createExportSection,
	createFunctionExport,
	createCodeSection,
	createImportSection,
	createMemoryImport,
	FunctionBody,
} from '@8f4e/bytecode-utils';
import { compile } from '@8f4e/module-compiler';
import { getInitialMemory, ModuleGenerator } from '.';
import { CompiledModule, MemoryMap } from './types';
import wabt from 'wabt';

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

export async function createTestModule(
	moduleCreator: ModuleGenerator | string,
	initialConfig = {}
): Promise<{
	memory: Int32Array;
	test: CallableFunction;
	reset: () => void;
	wat: string;
	program: Uint8Array;
	memoryMap: MemoryMap[];
}> {
	let module: CompiledModule;

	if (typeof moduleCreator === 'function') {
		module = moduleCreator('test', { byte: nthWord => nthWord * 4, word: nthWord => nthWord }, initialConfig);
	} else {
		module = compile(moduleCreator, 'test', 0);
	}

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

	return { memory: memoryBuffer, test, reset, wat, program, memoryMap: module.memoryMap };
}
