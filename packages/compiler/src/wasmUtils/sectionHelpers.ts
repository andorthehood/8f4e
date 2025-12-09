import {
	FunctionBody,
	FunctionExport,
	FunctionName,
	FunctionType,
	Import,
	LocalDeclaration,
	createVector,
	encodeString,
	unsignedLEB128,
} from './typeHelpers';
import Instruction from './wasmInstruction';
import { ExportDesc, ImportDesc, NameSection, Section } from './section';
import Type from './type';

export function createFunctionSection(functionTypeIndexes: number[]): number[] {
	const numberOfFunctions = functionTypeIndexes.length;

	return [Section.FUNCTION, ...createVector([...unsignedLEB128(numberOfFunctions), ...functionTypeIndexes])];
}

export function createFunctionType(parameterTypes: Type[], resultTypes: Type[] = []): FunctionType {
	const numberOfParameters = parameterTypes.length;
	const numberOfResults = resultTypes.length;

	return [
		0x60,
		...unsignedLEB128(numberOfParameters),
		...parameterTypes,
		...unsignedLEB128(numberOfResults),
		...resultTypes,
	];
}

export function createTypeSection(types: FunctionType[]): number[] {
	const numberOfTypes = types.length;
	return [Section.TYPE, ...createVector([...unsignedLEB128(numberOfTypes), ...types.flat()])];
}

export function createExportSection(_exports: FunctionExport[]): number[] {
	const numberOfExports = _exports.length;
	return [Section.EXPORT, ...createVector([...unsignedLEB128(numberOfExports), ..._exports.flat()])];
}

export function createFunctionExport(name: string, reference: number): FunctionExport {
	return [...encodeString(name), ExportDesc.FUNC, reference];
}

export function createCodeSection(functionBodies: FunctionBody[]): number[] {
	const numberOfFunctions = functionBodies.length;
	return [Section.CODE, ...createVector([...unsignedLEB128(numberOfFunctions), ...functionBodies.flat()])];
}
export function createFunction(localDeclarations: LocalDeclaration[], functionBody: number[]): FunctionBody {
	const localDeclarationCount = localDeclarations.length;
	return createVector([
		...unsignedLEB128(localDeclarationCount),
		...localDeclarations.flat(),
		...functionBody,
		Instruction.END,
	]);
}

export function createLocalDeclaration(type: Type, typeCount = 1): LocalDeclaration {
	return [...unsignedLEB128(typeCount), type];
}

export function createMemorySection(pageSize: number): number[] {
	const numberOfMemoryEntries = 1;
	const flags = 0x01; // Means that there is no maximum memory size.
	return [
		Section.MEMORY,
		...createVector([...unsignedLEB128(numberOfMemoryEntries), ...unsignedLEB128(flags), ...unsignedLEB128(pageSize)]),
	];
}

export function createNameSection(functionNames: FunctionName[]): number[] {
	const numFunctions = functionNames.length;
	return [
		Section.CUSTOM,
		...createVector([
			...encodeString('name'),
			NameSection.FUNCTION_NAME,
			...createVector([...unsignedLEB128(numFunctions), ...functionNames.flat()]),
		]),
	];
}

export function createFunctionName(functionIndex: number, name: string): FunctionName {
	return [...unsignedLEB128(functionIndex), ...encodeString(name)];
}

export function createMemoryImport(
	moduleName: string,
	fieldName: string,
	initial = 1,
	max?: number,
	isShared = false
): Import {
	let flags = 0x00;
	if (isShared) {
		flags = 0x03;
	} else if (max !== undefined) {
		flags = 0x01;
	}

	return [
		...encodeString(moduleName),
		...encodeString(fieldName),
		ImportDesc.MEMORY,
		flags,
		...unsignedLEB128(initial),
		...(max !== undefined ? unsignedLEB128(max) : []),
	];
}

export function createImportSection(imports: Import[]): number[] {
	const numImports = imports.length;
	return [Section.IMPORT, ...createVector([...unsignedLEB128(numImports), ...imports.flat()])];
}
