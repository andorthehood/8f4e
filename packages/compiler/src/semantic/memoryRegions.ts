import type { CompilationContext, CompileOptions, CompilerASTLine, RegionLine } from '@8f4e/compiler-spec';
import { ArgumentType, ErrorCode } from '@8f4e/compiler-spec';
import { getError } from '../compilerError';

export const DEFAULT_MEMORY_INDEX = 0;
const RESERVED_REGION_NAMES = new Set(['default', 'memory']);

export interface ResolvedMemoryRegion {
	memoryIndex: number;
	memoryRegionName?: string;
}

function fallbackLine(): CompilerASTLine {
	return {
		lineNumberBeforeMacroExpansion: 0,
		lineNumberAfterMacroExpansion: 0,
		instruction: 'block',
		arguments: [],
	};
}

export function getCustomMemoryRegionName(memoryRegions: readonly string[], memoryIndex: number): string {
	return memoryRegions[memoryIndex - 1]!;
}

export function getMemoryRegionFields(memoryIndex: number, memoryRegionName?: string): ResolvedMemoryRegion {
	return {
		memoryIndex,
		...(memoryRegionName ? { memoryRegionName } : {}),
	};
}

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

export function resolveRegionDirective(line: RegionLine, context: CompilationContext): ResolvedMemoryRegion {
	const [argument] = line.arguments;
	if (argument.type === ArgumentType.LITERAL) {
		return resolveMemoryRegionByIndex(argument.value, context.memoryRegions, line, context);
	}

	return resolveMemoryRegionName(argument.value, context.memoryRegions, line, context);
}

export function getDefaultMemoryRegion(): ResolvedMemoryRegion {
	return { memoryIndex: DEFAULT_MEMORY_INDEX };
}
