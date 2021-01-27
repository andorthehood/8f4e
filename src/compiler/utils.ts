const enum Section {
	TYPE = 0x01,
	FUNCTION = 0x03,
	MEMORY = 0x05,
	EXPORT = 0x07,
	CODE = 0x0a,
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
	LOCAL_GET = 0x20,
	I32_ADD = 0x6a,
}

type LocalDeclaration = number[];
type FunctionBody = number[];
type FunctionExport = number[];
type FunctionType = number[];

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
	return str.split('').map(char => char.charCodeAt(0));
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
	const stringLength = name.length;
	return [...unsignedLEB128(stringLength), ...encodeString(name), ExportDesc.FUNC, reference];
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
	return createVector([...unsignedLEB128(localDeclarationCount), ...flatten(localDeclarations), ...functionBody]);
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
