import type { Module } from '@8f4e/language-spec';
import { INCLUDES_BLOCK_DELIMITER } from './delimiters';
import { isProjectGapLine } from './projectLines';
import type { ProjectBlock } from './types';

export type ProjectIncludeResolver = (includeId: string) => string | undefined;
export type ProjectIncludeResolverAsync = (includeId: string) => string | Promise<string | undefined> | undefined;

export class ProjectIncludeError extends Error {
	constructor(
		message: string,
		readonly lineNumber: number,
		readonly projectBlockId?: number
	) {
		super(`Parse error at line ${lineNumber}: ${message}`);
		this.name = 'ProjectIncludeError';
	}
}

function getFunctionName(line: string): string {
	return line.trim().split(/\s+/)[1] ?? '';
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

function splitFunctionBlocks(lines: string[]): string[][] {
	const blocks: string[][] = [];
	let currentBlock: string[] | undefined;

	for (const line of lines) {
		if (startsWithInstruction(line, 'function')) {
			currentBlock = [line];
			continue;
		}

		currentBlock?.push(line);

		if (startsWithInstruction(line, 'functionEnd')) {
			blocks.push(currentBlock ?? [line]);
			currentBlock = undefined;
		}
	}

	return blocks;
}

/**
 * Converts resolved include source text into function source blocks.
 */
export function resolveFunctionIncludeSource(includeId: string, source: string): Module[] {
	return splitFunctionBlocks(normalizeSourceLines(source)).map(code => ({
		code,
		source: {
			kind: 'include' as const,
			includeId,
			symbolName: getFunctionName(code[0] ?? ''),
		},
	}));
}

export function collectProjectIncludeIdsFromBlock(block: Pick<ProjectBlock, 'code' | 'id'>) {
	const includeIds: Array<{ includeId: string; lineNumber: number }> = [];

	for (const [index, line] of block.code.entries()) {
		const lineNumber = index + 1;
		const trimmed = line.trim();
		if (
			trimmed === INCLUDES_BLOCK_DELIMITER.opener ||
			trimmed === INCLUDES_BLOCK_DELIMITER.closer ||
			isProjectGapLine(trimmed)
		) {
			continue;
		}

		const [instruction, includeId, ...extraArgs] = trimmed.split(/\s+/);
		if (instruction !== 'include' || !includeId || extraArgs.length > 0) {
			throw new ProjectIncludeError('include requires exactly one include id', lineNumber, block.id);
		}
		includeIds.push({ includeId, lineNumber });
	}

	return includeIds;
}

export function collectProjectIncludeIdsFromText(text: string): string[] {
	const includeIds: string[] = [];
	const lines = text.split('\n');

	for (let i = 1; i < lines.length; i += 1) {
		const trimmed = lines[i].trim();
		if (trimmed !== INCLUDES_BLOCK_DELIMITER.opener) {
			continue;
		}

		const blockLines = [lines[i]];
		const blockStartLineNumber = i + 1;
		for (i += 1; i < lines.length; i += 1) {
			blockLines.push(lines[i]);
			if (lines[i].trim() === INCLUDES_BLOCK_DELIMITER.closer) {
				break;
			}
		}

		includeIds.push(
			...collectProjectIncludeIdsFromBlock({ id: blockStartLineNumber, code: blockLines }).map(
				({ includeId }) => includeId
			)
		);
	}

	return includeIds;
}

export function resolveProjectIncludes(
	includeBlocks: readonly Pick<ProjectBlock, 'code' | 'id' | 'disabled'>[],
	resolveInclude: ProjectIncludeResolver
): Module[] {
	const includedFunctionBlocks: Module[] = [];

	for (const block of includeBlocks) {
		if (block.disabled) {
			continue;
		}
		for (const { includeId, lineNumber } of collectProjectIncludeIdsFromBlock(block)) {
			const source = resolveInclude(includeId);
			if (source === undefined) {
				throw new ProjectIncludeError(`unresolved include "${includeId}"`, lineNumber, block.id);
			}

			includedFunctionBlocks.push(...resolveFunctionIncludeSource(includeId, source));
		}
	}

	return includedFunctionBlocks;
}

export async function resolveProjectIncludesAsync(
	includeBlocks: readonly Pick<ProjectBlock, 'code' | 'id' | 'disabled'>[],
	resolveInclude: ProjectIncludeResolverAsync
): Promise<Module[]> {
	const includeSources = new Map<string, string | undefined>();

	for (const block of includeBlocks) {
		if (block.disabled) {
			continue;
		}
		for (const { includeId } of collectProjectIncludeIdsFromBlock(block)) {
			if (!includeSources.has(includeId)) {
				includeSources.set(includeId, await resolveInclude(includeId));
			}
		}
	}

	return resolveProjectIncludes(includeBlocks, includeId => includeSources.get(includeId));
}
