import {
	unsignedLEB128,
	encodeVector,
	createSection,
	encodeString,
	createFunctionSection,
	createTypeSection,
	createFunctionType,
	createExportSection,
	createFunctionExport,
} from './utils';

const HEADER = [0x00, 0x61, 0x73, 0x6d];
const VERSION = [0x01, 0x00, 0x00, 0x00];

const enum Section {
	TYPE = 0x01,
	FUNCTION = 0x03,
	EXPORT = 0x07,
	CODE = 0x0a,
}

const enum Type {
	I32 = 0x7f,
	F32 = 0x7d,
}

const enum Instruction {
	END = 0x0b,
	LOCAL_GET = 0x20,
	I32_ADD = 0x6a,
}

const compile = function () {
	return Uint8Array.from([
		...HEADER,
		...VERSION,
		...createTypeSection([
			createFunctionType([Type.I32, Type.I32], Type.I32),
			createFunctionType([Type.I32]),
			createFunctionType([], Type.I32),
		]),
		...createFunctionSection([0x00, 0x00, 0x00]),
		...createExportSection([createFunctionExport('add', 0x00)]),
		...createSection(Section.CODE, [
			encodeVector([
				0x00,
				Instruction.LOCAL_GET,
				...unsignedLEB128(0),
				Instruction.LOCAL_GET,
				...unsignedLEB128(1),
				Instruction.I32_ADD,
				Instruction.END,
			]),
			encodeVector([
				0x00,
				Instruction.LOCAL_GET,
				...unsignedLEB128(0),
				Instruction.LOCAL_GET,
				...unsignedLEB128(1),
				Instruction.I32_ADD,
				Instruction.END,
			]),
			encodeVector([
				0x00,
				Instruction.LOCAL_GET,
				...unsignedLEB128(0),
				Instruction.LOCAL_GET,
				...unsignedLEB128(1),
				Instruction.I32_ADD,
				Instruction.END,
			]),
		]),
	]);
};

const decompile = function () {};

export default compile;
