import type { CompilationContext, CompileOptions, CompilerASTLine, RegionLine } from '@8f4e/compiler-spec';
import { ArgumentType, ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../compilerError';

/** WebAssembly memory index used when no custom region is active. */
export const DEFAULT_MEMORY_INDEX = 0;
const RESERVED_REGION_NAMES = new Set(['default', 'memory']);

/** Resolved memory region identity used by semantic layout and codegen. */
export interface ResolvedMemoryRegion {
	memoryIndex: number;
	memoryRegionName?: string;
}

function fallbackLine(): CompilerASTLine {
	return {
		lineNumber: 0,
		instruction: 'block',
		arguments: [],
	};
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
 * Builds the optional memory region fields stored on namespaces and memory metadata.
 *
 * @param memoryIndex - Memory index to resolve.
 * @param memoryRegionName - Configured memory region name to resolve.
 * @returns The result of the operation.
 */
export function getMemoryRegionFields(memoryIndex: number, memoryRegionName?: string): ResolvedMemoryRegion {
	return {
		memoryIndex,
		...(memoryRegionName ? { memoryRegionName } : {}),
	};
}

/**
 * Validates configured memory region names before semantic compilation uses them.
 *
 * @param options - Compiler options for this compilation pass.
 * @param line - Compiler line being processed.
 */
export function validateMemoryRegionOptions(
	options?: Pick<CompileOptions, 'memoryRegions'>,
	line: CompilerASTLine = fallbackLine()
): void {
	const seen = new Set<string>();

	for (const name of options?.memoryRegions ?? []) {
		if (RESERVED_REGION_NAMES.has(name) || /^\d+$/.test(name)) {
			throw getError(ErrorCode.INVALID_MEMORY_REGION_NAME, line, undefined, { identifier: name });
		}
		if (seen.has(name)) {
			throw getError(ErrorCode.DUPLICATE_MEMORY_REGION_NAME, line, undefined, { identifier: name });
		}
		seen.add(name);
	}
}

/**
 * Resolves a numeric region directive argument into memory region metadata.
 *
 * @param memoryIndex - Memory index to resolve.
 * @param memoryRegions - Configured custom memory region names.
 * @param line - Compiler line being processed.
 * @param context - Current compiler context consulted or updated by the operation.
 * @returns The result of the operation.
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
 * @param line - Compiler line being processed.
 * @param context - Current compiler context consulted or updated by the operation.
 * @returns The result of the operation.
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
 * @param line - Compiler line being processed.
 * @param context - Current compiler context consulted or updated by the operation.
 * @returns The result of the operation.
 */
export function resolveRegionDirective(line: RegionLine, context: CompilationContext): ResolvedMemoryRegion {
	const [argument] = line.arguments;
	if (argument.type === ArgumentType.LITERAL) {
		return resolveMemoryRegionByIndex(argument.value, context.memoryRegions, line, context);
	}

	return resolveMemoryRegionName(argument.value, context.memoryRegions, line, context);
}

/**
 * Returns metadata for the default WebAssembly memory region.
 *
 * @returns The result of the operation.
 */
export function getDefaultMemoryRegion(): ResolvedMemoryRegion {
	return { memoryIndex: DEFAULT_MEMORY_INDEX };
}
