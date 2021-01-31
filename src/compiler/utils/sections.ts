import { createVector, unsignedLEB128, flatten, encodeString } from './utils';
import { FunctionBody, FunctionType, FunctionExport, FunctionName, LocalDeclaration, Import } from '../types';
import { Section, Type, Instruction, ImportDesc, NameSection, ExportDesc } from '../enums';

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

export const createFunctionName = function (functionIndex: number, name: string): FunctionName {
	return [...unsignedLEB128(functionIndex), ...encodeString(name)];
};

export const createMemoryImport = function (moduleName: string, fieldName: string, initial: number = 1): Import {
	return [
		...encodeString(moduleName),
		...encodeString(fieldName),
		ImportDesc.MEMORY,
		0x00, // flags
		...unsignedLEB128(initial),
	];
};

export const createImportSection = function (imports: Import[]): number[] {
	const numImports = imports.length;
	return [Section.IMPORT, ...createVector([...unsignedLEB128(numImports), ...flatten(imports)])];
};
