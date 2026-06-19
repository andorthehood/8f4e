import type { Module } from '@8f4e/language-spec';

export class IncludeFunctionError extends Error {
	constructor(
		message: string,
		readonly lineNumber: number
	) {
		super(`Parse error at line ${lineNumber}: ${message}`);
		this.name = 'IncludeFunctionError';
	}
}

type FunctionIncludeBlock = {
	code: string[];
	startLineNumber: number;
};

type IncludeExport = {
	lineIndex: number;
	publicName: string;
};

type IncludeFunction = {
	code: string[];
	startLineNumber: number;
	originalName: string;
	finalName: string;
	export?: IncludeExport;
};

function getFunctionName(line: string): string {
	return line.trim().split(/\s+/)[1] ?? '';
}

function getIncludeFunctionPrefix(includeId: string): string {
	return `__8f4e_${includeId.replace(/[^a-zA-Z0-9]+/g, '_')}__`;
}

function startsWithInstruction(line: string, instruction: string): boolean {
	const trimmed = line.trim();
	const nextCharacter = trimmed[instruction.length];
	return (
		trimmed === instruction || (trimmed.startsWith(instruction) && (nextCharacter === ' ' || nextCharacter === '\t'))
	);
}

function normalizeSourceLines(source: string): string[] {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	return lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines;
}

function splitFunctionBlocks(lines: string[]): FunctionIncludeBlock[] {
	const blocks: FunctionIncludeBlock[] = [];
	let currentBlock: FunctionIncludeBlock | undefined;

	for (const [index, line] of lines.entries()) {
		if (startsWithInstruction(line, 'function')) {
			currentBlock = { code: [line], startLineNumber: index + 1 };
			continue;
		}

		currentBlock?.code.push(line);

		if (startsWithInstruction(line, 'functionEnd')) {
			blocks.push(currentBlock ?? { code: [line], startLineNumber: index + 1 });
			currentBlock = undefined;
		}
	}

	return blocks;
}

function getIncludeExport(includeId: string, block: FunctionIncludeBlock): IncludeExport | undefined {
	let includeExport: IncludeExport | undefined;

	for (const [lineIndex, line] of block.code.entries()) {
		if (!startsWithInstruction(line, '#export')) {
			continue;
		}

		if (includeExport) {
			throw new IncludeFunctionError(
				`include "${includeId}" function can only declare one #export`,
				block.startLineNumber + lineIndex
			);
		}

		const [, publicName, ...extraArgs] = line.trim().split(/\s+/);
		if (extraArgs.length > 0) {
			throw new IncludeFunctionError(
				`include "${includeId}" #export accepts at most one alias`,
				block.startLineNumber + lineIndex
			);
		}

		includeExport = {
			lineIndex,
			publicName: publicName ?? getFunctionName(block.code[0] ?? ''),
		};
	}

	return includeExport;
}

function replaceInstructionFirstArgument(line: string, instruction: string, argument: string): string {
	return line.replace(new RegExp(`^(\\s*${instruction}\\s+)\\S+`), `$1${argument}`);
}

function getLineFirstArgument(line: string): string {
	return line.trim().split(/\s+/)[1] ?? '';
}

function createIncludeFunctions(includeId: string, blocks: FunctionIncludeBlock[]): IncludeFunction[] {
	const prefix = getIncludeFunctionPrefix(includeId);
	const functions = blocks.map(block => {
		const originalName = getFunctionName(block.code[0] ?? '');
		const includeExport = getIncludeExport(includeId, block);

		return {
			...block,
			originalName,
			finalName: includeExport?.publicName ?? `${prefix}${originalName}`,
			...(includeExport ? { export: includeExport } : {}),
		};
	});

	if (functions.every(func => !func.export)) {
		throw new IncludeFunctionError(`include "${includeId}" must export at least one function`, 1);
	}

	return functions;
}

function createCallTargetRewriteMap(includeId: string, functions: IncludeFunction[]): Map<string, string> {
	const finalNamesByOriginalName = new Map<string, Set<string>>();

	for (const func of functions) {
		const names = finalNamesByOriginalName.get(func.originalName) ?? new Set<string>();
		names.add(func.finalName);
		finalNamesByOriginalName.set(func.originalName, names);
	}

	const rewriteMap = new Map<string, string>();
	const ambiguousNames = new Set<string>();

	for (const [originalName, finalNames] of finalNamesByOriginalName) {
		if (finalNames.size === 1) {
			rewriteMap.set(originalName, [...finalNames][0]!);
		} else {
			ambiguousNames.add(originalName);
		}
	}

	for (const func of functions) {
		for (const [lineIndex, line] of func.code.entries()) {
			if (!startsWithInstruction(line, 'call')) {
				continue;
			}
			const targetName = getLineFirstArgument(line);
			if (ambiguousNames.has(targetName)) {
				throw new IncludeFunctionError(
					`include "${includeId}" call target "${targetName}" is ambiguous because that function name expands to multiple public/internal include names`,
					func.startLineNumber + lineIndex
				);
			}
		}
	}

	return rewriteMap;
}

function rewriteIncludeFunctionCode(
	func: IncludeFunction,
	callTargetRewriteMap: ReadonlyMap<string, string>
): string[] {
	return func.code.map((line, lineIndex) => {
		if (lineIndex === 0) {
			return replaceInstructionFirstArgument(line, 'function', func.finalName);
		}
		if (func.export?.lineIndex === lineIndex) {
			return '';
		}
		if (startsWithInstruction(line, 'call')) {
			const targetName = getLineFirstArgument(line);
			const rewrittenTargetName = callTargetRewriteMap.get(targetName);
			if (rewrittenTargetName && rewrittenTargetName !== targetName) {
				return replaceInstructionFirstArgument(line, 'call', rewrittenTargetName);
			}
		}
		return line;
	});
}

/**
 * Converts resolved include source text into function source blocks.
 */
export function resolveFunctionIncludeSource(includeId: string, source: string): Module[] {
	const includeFunctions = createIncludeFunctions(includeId, splitFunctionBlocks(normalizeSourceLines(source)));
	const callTargetRewriteMap = createCallTargetRewriteMap(includeId, includeFunctions);

	return includeFunctions.map(func => ({
		code: rewriteIncludeFunctionCode(func, callTargetRewriteMap),
		source: {
			kind: 'include' as const,
			includeId,
			symbolName: func.finalName,
		},
	}));
}
