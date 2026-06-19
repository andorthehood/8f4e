import { documentBlockInstructionByType } from '@8f4e/language-spec';

export type IncludeSourceResolver = (includeId: string) => string | undefined;
export type IncludeSourceResolverAsync = (includeId: string) => string | Promise<string | undefined> | undefined;

export interface IncludeDeclaration {
	includeId: string;
	lineNumber: number;
}

export interface IncludeParseResult {
	source: string;
	includes: IncludeDeclaration[];
}

export interface IncludeSourceTreeNode {
	includeId: string;
	source: string;
	children: IncludeSourceTreeNode[];
}

export interface IncludeSourceTree {
	source: string;
	children: IncludeSourceTreeNode[];
}

export class IncludeResolutionError extends Error {
	constructor(
		message: string,
		readonly lineNumber: number
	) {
		super(`Parse error at line ${lineNumber}: ${message}`);
		this.name = 'IncludeResolutionError';
	}
}

const includeBlock = documentBlockInstructionByType.includes;

function normalizeSourceLines(source: string): string[] {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	return lines[lines.length - 1] === '' ? lines.slice(0, -1) : lines;
}

function isGapLine(trimmedLine: string): boolean {
	return (
		trimmedLine === '' || trimmedLine.startsWith('#') || trimmedLine.startsWith(';') || trimmedLine.startsWith('//')
	);
}

function parseIncludeDeclarationLine(line: string, lineNumber: number): IncludeDeclaration {
	const [instruction, includeId, ...extraArgs] = line.trim().split(/\s+/);
	if (instruction !== 'include' || !includeId || extraArgs.length > 0) {
		throw new IncludeResolutionError('include requires exactly one include id', lineNumber);
	}
	return { includeId, lineNumber };
}

export function parseIncludeDeclarations(source: string): IncludeParseResult {
	const includes: IncludeDeclaration[] = [];
	const lines = normalizeSourceLines(source);
	let includeBlockStartLineNumber: number | undefined;
	let hasSeenIncludeBlock = false;

	for (const [index, line] of lines.entries()) {
		const lineNumber = index + 1;
		const trimmed = line.trim();

		if (includeBlockStartLineNumber === undefined) {
			if (trimmed === includeBlock.end) {
				throw new IncludeResolutionError(`unexpected ${includeBlock.end}`, lineNumber);
			}
			if (trimmed !== includeBlock.start) {
				continue;
			}
			if (hasSeenIncludeBlock) {
				throw new IncludeResolutionError('project can contain at most one includes block', lineNumber);
			}
			hasSeenIncludeBlock = true;
			includeBlockStartLineNumber = lineNumber;
			continue;
		}

		if (trimmed === includeBlock.start) {
			throw new IncludeResolutionError('nested includes blocks are not supported', lineNumber);
		}
		if (trimmed === includeBlock.end) {
			includeBlockStartLineNumber = undefined;
			continue;
		}
		if (isGapLine(trimmed)) {
			continue;
		}

		includes.push(parseIncludeDeclarationLine(line, lineNumber));
	}

	if (includeBlockStartLineNumber !== undefined) {
		throw new IncludeResolutionError(`unclosed block with opener "${includeBlock.start}"`, includeBlockStartLineNumber);
	}

	return { source, includes };
}

export function resolveIncludeSourceTree(source: string, resolveInclude: IncludeSourceResolver): IncludeSourceTree {
	const parsed = parseIncludeDeclarations(source);
	const resolvedIncludeIds = new Set<string>();
	const children: IncludeSourceTreeNode[] = [];

	for (const { includeId, lineNumber } of parsed.includes) {
		if (resolvedIncludeIds.has(includeId)) {
			continue;
		}

		const includeSource = resolveInclude(includeId);
		if (includeSource === undefined) {
			throw new IncludeResolutionError(`unresolved include "${includeId}"`, lineNumber);
		}

		children.push({ includeId, source: includeSource, children: [] });
		resolvedIncludeIds.add(includeId);
	}

	return { source: parsed.source, children };
}

export async function resolveIncludeSourceTreeAsync(
	source: string,
	resolveInclude: IncludeSourceResolverAsync
): Promise<IncludeSourceTree> {
	const parsed = parseIncludeDeclarations(source);
	const includeSources = new Map<string, string | undefined>();

	for (const { includeId } of parsed.includes) {
		if (!includeSources.has(includeId)) {
			includeSources.set(includeId, await resolveInclude(includeId));
		}
	}

	return resolveIncludeSourceTree(source, includeId => includeSources.get(includeId));
}
