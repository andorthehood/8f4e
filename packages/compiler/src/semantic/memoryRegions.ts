import { ArgumentType, ErrorCode } from '@8f4e/compiler-spec';

import { getError } from '../compilerError';

import type { AST, CompileOptions, CompilationContext, RegionLine } from '@8f4e/compiler-spec';

export const DEFAULT_MEMORY_INDEX = 0;
const RESERVED_REGION_NAMES = new Set(['default', 'memory']);

export interface ResolvedMemoryRegion {
	memoryIndex: number;
	memoryRegionName?: string;
}

function fallbackLine(): AST[number] {
	return {
		lineNumberBeforeMacroExpansion: 0,
		lineNumberAfterMacroExpansion: 0,
		instruction: '#region',
		arguments: [],
	};
}

function isNumericRegionName(name: string): boolean {
	return /^\d+$/.test(name);
}

export function getMemoryRegions(options?: Pick<CompileOptions, 'memoryRegions'>): string[] {
	return options?.memoryRegions ?? [];
}

export function getMemoryRegionName(memoryRegions: readonly string[], memoryIndex: number): string | undefined {
	return memoryIndex === DEFAULT_MEMORY_INDEX ? undefined : memoryRegions[memoryIndex - 1];
}

export function getMemoryRegionFields(
	memoryIndex = DEFAULT_MEMORY_INDEX,
	memoryRegionName?: string
): ResolvedMemoryRegion {
	return {
		memoryIndex,
		...(memoryRegionName ? { memoryRegionName } : {}),
	};
}

export function getRequiredCustomMemoryRegionName(memoryRegions: readonly string[], memoryIndex: number): string {
	const memoryRegionName = getMemoryRegionName(memoryRegions, memoryIndex);
	if (!memoryRegionName) {
		throw new Error(`Missing configured memory region name for memory index ${memoryIndex}`);
	}
	return memoryRegionName;
}

export function validateMemoryRegionOptions(
	options?: Pick<CompileOptions, 'memoryRegions'>,
	line: AST[number] = fallbackLine()
): void {
	const seen = new Set<string>();

	for (const name of getMemoryRegions(options)) {
		if (RESERVED_REGION_NAMES.has(name) || isNumericRegionName(name)) {
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
	line: AST[number],
	context?: CompilationContext
): ResolvedMemoryRegion {
	if (!Number.isInteger(memoryIndex) || memoryIndex < 0 || memoryIndex > memoryRegions.length) {
		throw getError(ErrorCode.MEMORY_REGION_INDEX_OUT_OF_BOUNDS, line, context, { identifier: String(memoryIndex) });
	}

	const memoryRegionName = getMemoryRegionName(memoryRegions, memoryIndex);
	return {
		memoryIndex,
		...(memoryRegionName ? { memoryRegionName } : {}),
	};
}

export function resolveMemoryRegionName(
	memoryRegionName: string,
	memoryRegions: readonly string[],
	line: AST[number],
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
		return resolveMemoryRegionByIndex(argument.value, context.memoryRegions ?? [], line, context);
	}

	return resolveMemoryRegionName(argument.value, context.memoryRegions ?? [], line, context);
}

export function getDefaultMemoryRegion(): ResolvedMemoryRegion {
	return { memoryIndex: DEFAULT_MEMORY_INDEX };
}
