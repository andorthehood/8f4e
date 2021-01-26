const enum Section {
	TYPE = 0x01,
	FUNCTION = 0x03,
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
export const uLEB128 = function (n: number): number[] {
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

export const createFunctionSection = function (functionTypeIndexes: number[]): number[] {
	const numberOfFunctions = functionTypeIndexes.length;
	const sectionSize = numberOfFunctions + 1;

	return [Section.FUNCTION, ...uLEB128(sectionSize), ...uLEB128(numberOfFunctions), ...functionTypeIndexes];
};

export const createFunctionType = function (parameterTypes: Type[], resultType?: Type): FunctionType {
	const numberOfParameters = parameterTypes.length;
	const numberOfResults = resultType ? 1 : 0;

	return [
		0x60,
		...uLEB128(numberOfParameters),
		...parameterTypes,
		...uLEB128(numberOfResults),
		...(resultType ? [resultType] : []),
	];
};

export const createTypeSection = function (types: FunctionType[]): number[] {
	const sectionSize = flatten(types).length + 1;
	const numberOfTypes = types.length;

	return [Section.TYPE, ...uLEB128(sectionSize), ...uLEB128(numberOfTypes), ...flatten(types)];
};

export const createExportSection = function (_exports: FunctionExport[]): number[] {
	const sectionSize = flatten(_exports).length + 1;
	const numberOfExports = _exports.length;

	return [Section.EXPORT, ...uLEB128(sectionSize), ...uLEB128(numberOfExports), ...flatten(_exports)];
};

export const createFunctionExport = function (name: string, reference: number): FunctionExport {
	const stringLength = name.length;

	return [...uLEB128(stringLength), ...encodeString(name), ExportDesc.FUNC, reference];
};

export const createCodeSection = function (functionBodies: FunctionBody[]): number[] {
	const sectionSize = flatten(functionBodies).length + 1;
	const numberOfFunctions = functionBodies.length;
	return [Section.CODE, ...uLEB128(sectionSize), ...uLEB128(numberOfFunctions), ...flatten(functionBodies)];
};

export const createFunctionBody = function (
	localDeclarations: LocalDeclaration[],
	functionBody: number[]
): FunctionBody {
	const functionBodySize = functionBody.length + 1 + flatten(localDeclarations).length;
	const localDeclarationCount = localDeclarations.length;
	return [
		...uLEB128(functionBodySize),
		...uLEB128(localDeclarationCount),
		...flatten(localDeclarations),
		...functionBody,
	];
};

export const createLocalDeclaration = function (type: Type): LocalDeclaration {
	const typeCount = 1;
	return [...uLEB128(typeCount), type];
};
