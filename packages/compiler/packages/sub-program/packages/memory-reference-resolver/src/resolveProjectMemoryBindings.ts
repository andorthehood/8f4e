import {
	type Const,
	createProjectModuleId,
	ErrorCode,
	getError,
	isScalarMemoryDeclarationLine,
	type ProjectMemoryBindingScope,
} from '@8f4e/language-spec';
import {
	type MemoryReferenceResolutionContext,
	resolveIntermoduleMemoryTarget,
} from './resolveMemoryExpressionOperand';
import { tryResolveValueArgument } from './tryResolveValueArgument';

/** Resolves group bindings to initialization values keyed by canonical backing declarations. */
export function resolveProjectMemoryBindings(
	scopes: readonly ProjectMemoryBindingScope[],
	context: MemoryReferenceResolutionContext
): Map<string, Map<string, Const>> {
	const defaults = new Map<string, Map<string, Const>>();
	for (const scope of scopes) {
		for (const line of scope.bindings) {
			const diagnosticContext = { projectGroupPath: scope.groupPath };
			if (scope.parentGroupPath === undefined) {
				throw getError(ErrorCode.GROUP_MEMORY_BINDING_OUTSIDE_GROUP, line, diagnosticContext);
			}
			const [destination, source] = line.arguments;
			const name = destination.targetMemoryId;
			const { targetModuleId, targetMemory, targetModule } = resolveIntermoduleMemoryTarget(
				context,
				scope.groupPath,
				name
			);
			const declaration =
				targetMemory && targetModule!.declarationSources[targetModule!.declarations.indexOf(targetMemory)]!;
			if (
				!context.memoryAliases.get(scope.groupPath)?.has(name) ||
				!targetMemory?.pointeeBaseType ||
				!isScalarMemoryDeclarationLine(declaration!.line)
			) {
				throw getError(ErrorCode.INVALID_GROUP_MEMORY_BINDING_TARGET, line, diagnosticContext, { identifier: name });
			}
			const moduleDefaults = defaults.get(targetModuleId) ?? new Map<string, Const>();
			if (moduleDefaults.has(targetMemory.id)) {
				throw getError(ErrorCode.DUPLICATE_GROUP_MEMORY_BINDING, line, diagnosticContext, { identifier: name });
			}
			const qualifiedSource = {
				...source,
				targetModuleId: createProjectModuleId(scope.parentGroupPath, source.targetModuleId),
			};
			const value = tryResolveValueArgument(context, qualifiedSource);
			if (!value) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, diagnosticContext, {
					identifier: `${qualifiedSource.targetModuleId}:${source.targetMemoryId}`,
				});
			}
			moduleDefaults.set(targetMemory.id, value);
			defaults.set(targetModuleId, moduleDefaults);
		}
	}
	return defaults;
}
