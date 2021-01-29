const enum Section {
	CUSTOM = 0x00,
	TYPE = 0x01,
	IMPORT = 0x02,
	FUNCTION = 0x03,
	MEMORY = 0x05,
	EXPORT = 0x07,
	CODE = 0x0a,
}

const enum NameSection {
	FUNCTION_NAME = 0x01,
	LOCAL_NAME = 0x02,
}

const enum ExportDesc {
	FUNC = 0x00,
}

export const enum Type {
	I32 = 0x7f,
	F32 = 0x7d,
}

export const enum Instruction {
	END = 0x0b,
	CALL = 0x10,
	LOCAL_GET = 0x20,
	I32_LOAD = 0x28,
	I32_STORE = 0x36,
	I32_CONST = 0x41,
	I32_ADD = 0x6a,
}

type LocalDeclaration = number[];
type FunctionBody = number[];
type FunctionExport = number[];
type FunctionType = number[];
type FunctionName = number[];
type LocalName = number[];
type Import = number[];

export const flatten = function (arr: any[]) {
	return [].concat.apply([], arr);
};

/**
 * LEB128 or Little Endian Base 128 is a variable-lenght code compression format like VLQ.
 * WebAssembly is using it's unsigned version for encoding all integer literals.
 */
export const unsignedLEB128 = function (n: number): number[] {
	const buffer = [];
	do {
		let byte = n & 0x7f;
		n >>>= 7;
		if (n !== 0) {
			byte |= 0x80;
		}
		buffer.push(byte);
	} while (n !== 0);
	return buffer;
};

export const encodeString = function (str: string) {
	return [...unsignedLEB128(str.length), ...str.split('').map(char => char.charCodeAt(0))];
};

export const createVector = function (data: number[]) {
	return [...unsignedLEB128(data.length), ...data];
};

export const createFunctionSection = function (functionTypeIndexes: number[]): number[] {
	const numberOfFunctions = functionTypeIndexes.length;

	return [Section.FUNCTION, ...createVector([...unsignedLEB128(numberOfFunctions), ...functionTypeIndexes])];
};

export const createFunctionType = function (parameterTypes: Type[], resultTypes: Type[] = []): FunctionType {
	const numberOfParameters = parameterTypes.length;
	const numberOfResults = resultTypes.length;

	return [
		0x60,
		...unsignedLEB128(numberOfParameters),
		...parameterTypes,
		...unsignedLEB128(numberOfResults),
		...resultTypes,
	];
};

export const createTypeSection = function (types: FunctionType[]): number[] {
	const numberOfTypes = types.length;
	return [Section.TYPE, ...createVector([...unsignedLEB128(numberOfTypes), ...flatten(types)])];
};

export const createExportSection = function (_exports: FunctionExport[]): number[] {
	const numberOfExports = _exports.length;
	return [Section.EXPORT, ...createVector([...unsignedLEB128(numberOfExports), ...flatten(_exports)])];
};

export const createFunctionExport = function (name: string, reference: number): FunctionExport {
	return [...encodeString(name), ExportDesc.FUNC, reference];
};

export const createCodeSection = function (functionBodies: FunctionBody[]): number[] {
	const numberOfFunctions = functionBodies.length;
	return [Section.CODE, ...createVector([...unsignedLEB128(numberOfFunctions), ...flatten(functionBodies)])];
};

export const createFunctionBody = function (
	localDeclarations: LocalDeclaration[],
	functionBody: number[]
): FunctionBody {
	const localDeclarationCount = localDeclarations.length;
	return createVector([
		...unsignedLEB128(localDeclarationCount),
		...flatten(localDeclarations),
		...functionBody,
		Instruction.END,
	]);
};

export const createLocalDeclaration = function (type: Type): LocalDeclaration {
	const typeCount = 1;
	return [...unsignedLEB128(typeCount), type];
};

export const createMemorySection = function (pageSize: number): number[] {
	const numMemories = 1;
	const flags = 0;
	return [
		Section.MEMORY,
		...createVector([...unsignedLEB128(numMemories), ...unsignedLEB128(flags), ...unsignedLEB128(pageSize)]),
	];
};

export const createNameSection = function (functionNames: FunctionName[]): number[] {
	const numFunctions = functionNames.length;
	return [
		Section.CUSTOM,
		...createVector([
			...encodeString('name'),
			NameSection.FUNCTION_NAME,
			...createVector([...unsignedLEB128(numFunctions), ...flatten(functionNames)]),
		]),
	];
};

export const createFunctioName = function (functionIndex: number, name: string): FunctionName {
	return [...unsignedLEB128(functionIndex), ...encodeString(name)];
};

export const call = function (functionIndex?: number): number[] {
	return [Instruction.CALL, ...unsignedLEB128(functionIndex)];
};

export const i32const = function (number: number): number[] {
	return [Instruction.I32_CONST, ...unsignedLEB128(number)];
};

export const i32store = function (
	address?: number,
	value?: number,
	alingment: number = 2,
	offset: number = 0
): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		...(typeof value === 'undefined' ? [] : i32const(value)),
		Instruction.I32_STORE,
		...unsignedLEB128(alingment),
		...unsignedLEB128(offset),
	];
};

export const i32load = function (address?: number, alingment: number = 2, offset: number = 0): number[] {
	return [
		...(typeof address === 'undefined' ? [] : i32const(address)),
		Instruction.I32_LOAD,
		...unsignedLEB128(alingment),
		...unsignedLEB128(offset),
	];
};

export const createImportSection = function (imports: Import[]): number[] {
	const numImports = imports.length;
	return [Section.IMPORT, ...createVector([...unsignedLEB128(numImports), ...flatten(imports)])];
};

export const createMemoryImport = function (moduleName: string, fieldName: string, initial: number = 1): Import {
	return [
		...encodeString(moduleName),
		...encodeString(fieldName),
		0x02,
		0x00, // flags
		...unsignedLEB128(initial),
	];
};
