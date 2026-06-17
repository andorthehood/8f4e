import {
	type CompilerDiagnosticContext,
	compilerSourceBlockInstructionByType,
	createFunctionId,
	ErrorCode,
	type FunctionMetadata,
	type FunctionMetadataLookup,
	type FunctionRegistry,
	getEffectiveFunctionMetadata,
	getError,
	getMemoryRegionFields,
	type Namespaces,
	type ValidatedFunctionAST,
	type ValidatedModuleAST,
	type ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import type { ResolveMemoryDefaultsResult } from '@8f4e/memory-default-resolver';
import type { MemoryLayoutPlan } from '@8f4e/memory-planner';

const moduleBlock = compilerSourceBlockInstructionByType.module;

function getAstDiagnosticContext(
	ast: ValidatedFunctionAST | ValidatedModuleAST | ValidatedPrototypeAST
): CompilerDiagnosticContext {
	return {
		codeBlockType: ast.type,
		...(ast.projectBlockId !== undefined ? { projectBlockId: ast.projectBlockId } : {}),
	};
}

/** Inputs for collecting function metadata and validating whole-program function names. */
type FunctionMetadataCollectionOptions = {
	importedFunctionBaseIndex: number;
	definedFunctionBaseIndex: number;
	reservedFunctionIds: readonly string[];
	reservedExportNames: readonly string[];
	prototypeShapes: Readonly<Record<string, ValidatedPrototypeAST>>;
};

/**
 * Scans function ASTs and collects pre-codegen function metadata.
 * This allows semantic reference resolution (e.g. `call` target validation) and
 * function-body codegen to rely on the same registry before full function
 * compilation completes.
 *
 * @param asts - Validated ASTs being processed.
 * @param options - Compiler options for this compilation pass.
 * @returns The computed result.
 */
export function collectFunctionMetadataFromAsts(
	asts: readonly ValidatedFunctionAST[],
	options: FunctionMetadataCollectionOptions
): FunctionRegistry {
	const byId: FunctionMetadataLookup = {};
	const arityByName: FunctionRegistry['arityByName'] = {};
	const overloadCountsByName = asts.reduce<Record<string, number>>((counts, ast) => {
		counts[ast.name] = (counts[ast.name] ?? 0) + 1;
		return counts;
	}, {});
	const seenFunctionIds = new Set(options.reservedFunctionIds);
	const reservedFunctionNames = new Set(options.reservedFunctionIds);
	const seenExportNames = new Set(options.reservedExportNames);
	let importedFunctionIndex = 0;
	let definedFunctionIndex = 0;

	for (const ast of asts) {
		const name = ast.name;
		const functionMetadata = getEffectiveFunctionMetadata(ast, options.prototypeShapes);
		const id = createFunctionId(name, functionMetadata.signature.parameters);
		if (reservedFunctionNames.has(name)) {
			throw getError(ErrorCode.DUPLICATE_IDENTIFIER, ast.functionLine, getAstDiagnosticContext(ast), {
				identifier: name,
			});
		}
		if (seenFunctionIds.has(id)) {
			throw getError(ErrorCode.DUPLICATE_FUNCTION_SIGNATURE, ast.functionLine, getAstDiagnosticContext(ast), {
				identifier: id,
			});
		}

		const existingArity = arityByName[name];
		const arity = functionMetadata.signature.parameters.length;
		if (existingArity !== undefined) {
			if (existingArity === 0 || arity === 0 || existingArity !== arity) {
				throw getError(ErrorCode.INVALID_FUNCTION_OVERLOAD_SET, ast.functionLine, getAstDiagnosticContext(ast), {
					identifier: name,
				});
			}
		}

		const importedFunction = ast.import;
		// Imported functions cannot be valid exports; keep that conflict in per-function directive validation.
		const exportName = importedFunction ? undefined : ast.exportName;
		if (exportName && overloadCountsByName[name] > 1) {
			throw getError(
				ErrorCode.OVERLOADED_FUNCTION_EXPORT_UNSUPPORTED,
				ast.exportLine ?? ast.functionLine,
				getAstDiagnosticContext(ast),
				{
					identifier: name,
				}
			);
		}
		if (exportName) {
			if (seenExportNames.has(exportName)) {
				throw getError(
					ErrorCode.DUPLICATE_EXPORT_NAME,
					ast.exportLine ?? ast.functionLine,
					getAstDiagnosticContext(ast),
					{
						identifier: exportName,
					}
				);
			}
			seenExportNames.add(exportName);
		}

		const metadata: FunctionMetadata = {
			id,
			name,
			signature: functionMetadata.signature,
			wasmIndex: importedFunction
				? options.importedFunctionBaseIndex + importedFunctionIndex++
				: options.definedFunctionBaseIndex + definedFunctionIndex++,
			...(importedFunction ? { import: importedFunction } : {}),
			...(functionMetadata.paramShapeExpansions ? { paramShapeExpansions: functionMetadata.paramShapeExpansions } : {}),
		};
		seenFunctionIds.add(id);
		byId[id] = metadata;
		arityByName[name] = arity;
	}

	return { byId, arityByName };
}

/**
 * Ensures module source blocks declare unique ids before namespace discovery.
 *
 * @param asts - Validated ASTs being processed.
 * @returns Nothing.
 */
export function assertUniqueModuleIds(asts: readonly ValidatedModuleAST[]): void {
	const seenModuleIds = new Set<string>();

	for (const ast of asts) {
		const id = ast.id;
		if (seenModuleIds.has(id)) {
			throw getError(ErrorCode.DUPLICATE_IDENTIFIER, ast.moduleLine, getAstDiagnosticContext(ast), { identifier: id });
		}
		seenModuleIds.add(id);
	}
}

/**
 * Discovers planned namespaces for modules.
 *
 * @param asts - Validated ASTs being processed.
 * @param memoryPlan - Completed memory layout plan for the project.
 * @param defaultResolution - Resolved defaults and pointer metadata keyed by module id.
 * @returns The computed result.
 */
export function collectNamespacesFromASTs(
	asts: readonly ValidatedModuleAST[],
	memoryPlan: MemoryLayoutPlan,
	defaultResolution: ResolveMemoryDefaultsResult
): Namespaces {
	const namespaces: Namespaces = {};

	for (const plannedModule of memoryPlan.moduleList) {
		namespaces[plannedModule.id] = {
			kind: moduleBlock.type,
			...getMemoryRegionFields(plannedModule.memoryIndex, plannedModule.memoryRegionName),
			byteAddress: plannedModule.byteAddress,
			wordAlignedSize: plannedModule.wordAlignedSize,
			memoryDefaults: defaultResolution.memoryDefaultsByModuleId[plannedModule.id]!,
			pointerMetadata: defaultResolution.pointerMetadataByModuleId[plannedModule.id]!,
		};
	}

	return namespaces;
}
