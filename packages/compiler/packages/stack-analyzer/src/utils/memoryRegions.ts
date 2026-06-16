import type { CompilationContext, CompilerASTLine, RegionLine } from '@8f4e/compiler-spec';
import { ArgumentType, ErrorCode, getError } from '@8f4e/compiler-spec';

/** WebAssembly memory index used when no custom region is active. */
export const DEFAULT_MEMORY_INDEX = 0;

/** Resolved memory region identity used by semantic layout and codegen. */
export interface ResolvedMemoryRegion {
	memoryIndex: number;
	memoryRegionName?: string;
}

/**
 * Returns the configured region name for a non-default memory index.
 *
 * @param memoryRegions - Configured custom memory region names.
 * @param memoryIndex - Memory index to resolve.
 * @returns The resolved string value.
 */
export function getCustomMemoryRegionName(memoryRegions: readonly string[], memoryIndex: number): string {
	return memoryRegions[memoryIndex - 1]!;
}

/**
 * Resolves a numeric region directive argument into memory region metadata.
 *
 * @param memoryIndex - Memory index to resolve.
 * @param memoryRegions - Configured custom memory region names.
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export function resolveMemoryRegionByIndex(
	memoryIndex: number,
	memoryRegions: readonly string[],
	line: CompilerASTLine,
	context?: CompilationContext
): ResolvedMemoryRegion {
	if (!Number.isInteger(memoryIndex) || memoryIndex < 0 || memoryIndex > memoryRegions.length) {
		throw getError(ErrorCode.MEMORY_REGION_INDEX_OUT_OF_BOUNDS, line, context, { identifier: String(memoryIndex) });
	}

	const memoryRegionName =
		memoryIndex === DEFAULT_MEMORY_INDEX ? undefined : getCustomMemoryRegionName(memoryRegions, memoryIndex);
	return {
		memoryIndex,
		...(memoryRegionName ? { memoryRegionName } : {}),
	};
}

/**
 * Resolves a named region directive argument into memory region metadata.
 *
 * @param memoryRegionName - Configured memory region name to resolve.
 * @param memoryRegions - Configured custom memory region names.
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export function resolveMemoryRegionName(
	memoryRegionName: string,
	memoryRegions: readonly string[],
	line: CompilerASTLine,
	context?: CompilationContext
): ResolvedMemoryRegion {
	const regionIndex = memoryRegions.indexOf(memoryRegionName);
	if (regionIndex === -1) {
		throw getError(ErrorCode.UNKNOWN_MEMORY_REGION, line, context, { identifier: memoryRegionName });
	}

	return {
		memoryIndex: regionIndex + 1,
		memoryRegionName,
	};
}

/**
 * Resolves the active memory region from a parsed `#region` directive line.
 *
 * @param line - AST line being processed.
 * @param context - Compilation context used by the operation.
 * @returns The computed result.
 */
export function resolveRegionDirective(line: RegionLine, context: CompilationContext): ResolvedMemoryRegion {
	const [argument] = line.arguments;
	if (argument.type === ArgumentType.LITERAL) {
		return resolveMemoryRegionByIndex(argument.value, context.memoryRegions, line, context);
	}

	return resolveMemoryRegionName(argument.value, context.memoryRegions, line, context);
}
