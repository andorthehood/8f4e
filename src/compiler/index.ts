import {
	unsignedLEB128,
	createFunctionSection,
	createTypeSection,
	createFunctionType,
	createExportSection,
	createFunctionExport,
	createCodeSection,
	createFunctionBody,
	createLocalDeclaration,
	createMemorySection,
	Type,
	Instruction,
} from './utils';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

const compile = function () {
	return Uint8Array.from([
		...HEADER,
		...VERSION,
		...createTypeSection([
			createFunctionType([Type.I32, Type.I32], [Type.I32]),
			createFunctionType([Type.I32]),
			createFunctionType([], [Type.I32]),
		]),
		...createFunctionSection([0x00, 0x00, 0x00]),
		...createMemorySection(1),
		...createExportSection([createFunctionExport('add', 0x00)]),
		...createCodeSection([
			createFunctionBody(
				[],
				[
					Instruction.LOCAL_GET,
					...unsignedLEB128(0),
					Instruction.LOCAL_GET,
					...unsignedLEB128(1),
					Instruction.I32_ADD,
					Instruction.END,
				]
			),
			createFunctionBody(
				[],
				[
					Instruction.LOCAL_GET,
					...unsignedLEB128(0),
					Instruction.LOCAL_GET,
					...unsignedLEB128(1),
					Instruction.I32_ADD,
					Instruction.END,
				]
			),
			createFunctionBody(
				[createLocalDeclaration(Type.I32)],
				[
					Instruction.LOCAL_GET,
					...unsignedLEB128(0),
					Instruction.LOCAL_GET,
					...unsignedLEB128(1),
					Instruction.I32_ADD,
					Instruction.END,
				]
			),
		]),
	]);
};

export default compile;
