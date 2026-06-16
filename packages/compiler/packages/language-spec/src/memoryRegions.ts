import { ArgumentType } from './arguments';
import type { CompilerASTLine, RegionLine } from './ast';
import { ErrorCode, getError } from './compilerError';
import type { CompilerDiagnosticContext } from './diagnostics';
import type { MemoryRegionIdentity } from './memory';
import type { CompileOptions } from './options';
import type { CompilationContext } from './semantic';

export const DEFAULT_MEMORY_INDEX = 0;
export const RESERVED_MEMORY_REGION_NAMES: ReadonlySet<string> = new Set(['default', 'memory']);

function fallbackLine(): CompilerASTLine {
	return {
		lineNumber: 0,
		instruction: 'block',
		arguments: [],
	};
}

export function getDefaultMemoryRegion(): MemoryRegionIdentity {
	return { memoryIndex: DEFAULT_MEMORY_INDEX };
}

export function getCustomMemoryRegionName(memoryRegions: readonly string[], memoryIndex: number): string {
	return memoryRegions[memoryIndex - 1]!;
}

export function getMemoryRegionFields(memoryIndex: number, memoryRegionName?: string): MemoryRegionIdentity {
	return {
		memoryIndex,
		...(memoryRegionName ? { memoryRegionName } : {}),
	};
}

export function getMemoryRegionByIndex(memoryIndex: number, memoryRegions: readonly string[]): MemoryRegionIdentity {
	const memoryRegionName =
		memoryIndex === DEFAULT_MEMORY_INDEX ? undefined : getCustomMemoryRegionName(memoryRegions, memoryIndex);
	return getMemoryRegionFields(memoryIndex, memoryRegionName);
}

export function getMemoryRegionByName(
	memoryRegionName: string,
	memoryRegions: readonly string[]
): MemoryRegionIdentity {
	const regionIndex = memoryRegions.indexOf(memoryRegionName);
	return getMemoryRegionFields(regionIndex + 1, memoryRegionName);
}

export function validateMemoryRegionOptions(
	options?: Pick<CompileOptions, 'memoryRegions'>,
	line: CompilerASTLine = fallbackLine()
): void {
	const seen = new Set<string>();

	for (const name of options?.memoryRegions ?? []) {
		if (RESERVED_MEMORY_REGION_NAMES.has(name) || /^\d+$/.test(name)) {
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
	context?: CompilationContext | CompilerDiagnosticContext
): MemoryRegionIdentity {
	if (!Number.isInteger(memoryIndex) || memoryIndex < DEFAULT_MEMORY_INDEX || memoryIndex > memoryRegions.length) {
		throw getError(ErrorCode.MEMORY_REGION_INDEX_OUT_OF_BOUNDS, line, context, { identifier: String(memoryIndex) });
	}

	return getMemoryRegionByIndex(memoryIndex, memoryRegions);
}

export function resolveMemoryRegionName(
	memoryRegionName: string,
	memoryRegions: readonly string[],
	line: CompilerASTLine,
	context?: CompilationContext | CompilerDiagnosticContext
): MemoryRegionIdentity {
	if (!memoryRegions.includes(memoryRegionName)) {
		throw getError(ErrorCode.UNKNOWN_MEMORY_REGION, line, context, { identifier: memoryRegionName });
	}

	return getMemoryRegionByName(memoryRegionName, memoryRegions);
}

export function resolveRegionDirective(line: RegionLine, context: CompilationContext): MemoryRegionIdentity {
	const [argument] = line.arguments;
	if (argument.type === ArgumentType.LITERAL) {
		return resolveMemoryRegionByIndex(argument.value, context.memoryRegions, line, context);
	}

	return resolveMemoryRegionName(argument.value, context.memoryRegions, line, context);
}
