const enum Section {
	TYPE = 0x01,
	FUNCTION = 0x03,
	EXPORT = 0x07,
	CODE = 0x0a,
}

const enum ExportDesc {
	FUNC = 0x00,
}

export const flatten = function (arr: any[]) {
	return [].concat.apply([], arr);
};

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

export const encodeVector = function (code: any[]) {
	return [unsignedLEB128(code.length), ...flatten(code)];
};

export const encodeString = function (str: string) {
	return str.split('').map(char => char.charCodeAt(0));
};

export const createFunctionSection = function (functionTypeIndexes: number[]): number[] {
	const numberOfFunctions = functionTypeIndexes.length;
	const sectionSize = numberOfFunctions + 1;
	return [
		Section.FUNCTION,
		...unsignedLEB128(sectionSize),
		...unsignedLEB128(numberOfFunctions),
		...functionTypeIndexes,
	];
};

export const createFunctionType = function (parameterTypes: number[], resultType?: number) {
	const numberOfParameters = parameterTypes.length;
	const numberOfResults = resultType ? 1 : 0;
	return [
		0x60,
		...unsignedLEB128(numberOfParameters),
		...parameterTypes,
		...unsignedLEB128(numberOfResults),
		...(resultType ? [resultType] : []),
	];
};

export const createTypeSection = function (types: number[][]): number[] {
	const sectionSize = flatten(types).length + 1;
	const numberOfTypes = types.length;
	return [Section.TYPE, ...unsignedLEB128(sectionSize), ...unsignedLEB128(numberOfTypes), ...flatten(types)];
};

export const createExportSection = function (_exports: number[][]): number[] {
	const sectionSize = flatten(_exports).length + 1;
	const numberOfExports = _exports.length;

	return [Section.EXPORT, ...unsignedLEB128(sectionSize), ...unsignedLEB128(numberOfExports), ...flatten(_exports)];
};

export const createFunctionExport = function (name: string, reference: number): number[] {
	const stringLength = name.length;
	return [stringLength, ...encodeString('add'), ExportDesc.FUNC, reference];
};

export const createCodeSection = function (functionBodies: number[][]): number[] {
	const sectionSize = flatten(functionBodies).length + 1;
	const numberOfFunctions = functionBodies.length;
	return [
		Section.CODE,
		...unsignedLEB128(sectionSize),
		...unsignedLEB128(numberOfFunctions),
		...flatten(functionBodies),
	];
};

export const createFunctionBody = function (functionBody: number[]): number[] {
	const functionBodySize = functionBody.length;
	return [...unsignedLEB128(functionBodySize), ...functionBody];
};
