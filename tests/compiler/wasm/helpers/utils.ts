import {
	createFunctionSection,
	createTypeSection,
	createExportSection,
	createFunctionExport,
	createCodeSection,
} from '../../../../src/compiler/wasm/sections';
import { FunctionBody, FunctionType } from '../../../../src/compiler/wasm/types';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

export const createSingleFunctionWASMProgram = function (functionBody: FunctionBody, typeSignature: FunctionType): Uint8Array {
	return Uint8Array.from([
		...HEADER,
		...VERSION,
		...createTypeSection([typeSignature]),
		...createFunctionSection([0x00]),
		...createExportSection([createFunctionExport('test', 0x00)]),
		...createCodeSection([functionBody]),
	]);
};

export const createModuleForTestingHelpers = async function (functionBody: FunctionBody, typeSignature: FunctionType): Promise<{ test: any }> {
	const program = createSingleFunctionWASMProgram(functionBody, typeSignature);

	const {
		instance: {
			exports: { test },
		},
	} = await WebAssembly.instantiate(program);

	return { test };
};