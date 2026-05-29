import {
	compilableBlockTypes,
	documentBlockInstructionByType,
	documentBlockInstructionPairs,
} from '@8f4e/compiler-spec';

import type { CompilableBlockType, DocumentBlockType, Module } from '@8f4e/compiler-spec';

export const FORMAT_HEADER = '8f4e/v1';
export const GROUP_BLOCK_DELIMITER = { type: 'group', opener: 'group', closer: 'groupEnd' } as const;
export const BLOCK_DELIMITERS = documentBlockInstructionPairs.map(({ type, start, end }) => ({
	type,
	opener: start,
	closer: end,
}));

const blockDelimiters = compilableBlockTypes.map(type => documentBlockInstructionByType[type]);
const projectBlockDelimiters = [
	...documentBlockInstructionPairs.map(({ start, end }) => ({ opener: start, closer: end })),
	{ opener: GROUP_BLOCK_DELIMITER.opener, closer: GROUP_BLOCK_DELIMITER.closer },
];
const functionBlockType = documentBlockInstructionByType.function.type;
const macroBlockType = documentBlockInstructionByType.macro.type;
const moduleBlockType = documentBlockInstructionByType.module.type;
const closerByOpener = new Map<string, string>(projectBlockDelimiters.map(({ opener, closer }) => [opener, closer]));
const openerByCloser = new Map<string, string>(projectBlockDelimiters.map(({ opener, closer }) => [closer, opener]));

export interface ProjectCodeBlock {
	code: string[];
	disabled?: boolean;
	executionGroupName?: string;
}

export interface ProjectInput {
	codeBlocks: ProjectCodeBlock[];
	[key: string]: unknown;
}

export interface ProjectCompilerBlocks {
	groups: Record<string, Module[]>;
	constantsBlocks: Module[];
	functionBlocks: Module[];
	macroBlocks: Module[];
}

export type ProjectBlockType = CompilableBlockType | 'unknown';

function startsWithInstruction(line: string, instruction: string): boolean {
	const nextCharacter = line[instruction.length];
	return line === instruction || (line.startsWith(instruction) && (nextCharacter === ' ' || nextCharacter === '\t'));
}

export function getProjectOpenerKeyword(line: string): string | null {
	for (const opener of closerByOpener.keys()) {
		if (startsWithInstruction(line, opener)) {
			return opener;
		}
	}
	return null;
}

export function getProjectCloserKeyword(line: string): string | null {
	for (const closer of openerByCloser.keys()) {
		if (startsWithInstruction(line, closer)) {
			return closer;
		}
	}
	return null;
}

export function getExpectedProjectCloserPrefix(opener: string): string {
	return closerByOpener.get(opener) ?? opener + 'End';
}

function getGroupName(line: string, lineNumber: number): string {
	const [, ...args] = line.trim().split(/\s+/);
	const [groupName] = args;
	if (!groupName || args.length !== 1) {
		throw new Error(`Parse error at line ${lineNumber}: group requires exactly one name`);
	}
	return groupName;
}

export function getProjectBlockType(code: string[]): ProjectBlockType {
	for (const line of code) {
		const trimmed = line.trim();
		if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith(';') || trimmed.startsWith('//')) {
			continue;
		}
		const blockDelimiter = blockDelimiters.find(({ start }) => startsWithInstruction(trimmed, start));
		if (blockDelimiter) return blockDelimiter.type;
		break;
	}
	return 'unknown';
}

export function getDocumentProjectBlockType(code: string[]): DocumentBlockType | 'unknown' {
	const trimmedLines = code.map(line => line.trim());
	const markerMatches = BLOCK_DELIMITERS.map(({ type, opener, closer }) => ({
		type,
		hasOpener: trimmedLines.some(line => getProjectOpenerKeyword(line) === opener),
		hasCloser: trimmedLines.some(line => getProjectCloserKeyword(line) === closer),
	}));
	const presentTypes = markerMatches.filter(({ hasOpener, hasCloser }) => hasOpener || hasCloser);

	if (presentTypes.length !== 1) {
		return 'unknown';
	}

	const [match] = presentTypes;
	return match.hasOpener && match.hasCloser ? match.type : 'unknown';
}

export function parse8f4eProject(text: string): ProjectInput {
	const lines = text.split('\n');

	if (lines[0]?.trim() !== FORMAT_HEADER) {
		throw new Error(`Invalid .8f4e file: expected header "${FORMAT_HEADER}", got "${lines[0]?.trim() ?? ''}"`);
	}

	const codeBlocks: ProjectCodeBlock[] = [];
	const seenGroupNames = new Set<string>();

	function readDocumentBlock(startIndex: number, executionGroupName?: string): number {
		const openerLine = lines[startIndex];
		const openerKeyword = getProjectOpenerKeyword(openerLine.trim());
		if (!openerKeyword || openerKeyword === GROUP_BLOCK_DELIMITER.opener) {
			throw new Error(`Parse error at line ${startIndex + 1}: expected document block opener`);
		}

		const expectedCloser = getExpectedProjectCloserPrefix(openerKeyword);
		const currentBlockLines = [openerLine];

		for (let i = startIndex + 1; i < lines.length; i += 1) {
			const line = lines[i];
			const trimmed = line.trim();
			currentBlockLines.push(line);

			const closer = getProjectCloserKeyword(trimmed);
			if (closer) {
				if (closer !== expectedCloser) {
					throw new Error(`Parse error at line ${i + 1}: closer "${closer}" does not match opener "${openerKeyword}"`);
				}

				codeBlocks.push({ code: currentBlockLines, ...(executionGroupName ? { executionGroupName } : {}) });
				return i + 1;
			}

			if (trimmed !== '') {
				const innerOpener = getProjectOpenerKeyword(trimmed);
				if (innerOpener) {
					throw new Error(
						`Parse error at line ${i + 1}: mixed block type markers (found opener "${trimmed}" inside "${openerKeyword}" block)`
					);
				}
			}
		}

		throw new Error(`Parse error: unclosed block with opener "${openerKeyword}"`);
	}

	for (let i = 1; i < lines.length; ) {
		const trimmed = lines[i].trim();

		if (trimmed === '') {
			i += 1;
			continue;
		}

		const opener = getProjectOpenerKeyword(trimmed);
		if (!opener) {
			throw new Error(`Parse error at line ${i + 1}: expected opener keyword, got "${trimmed}"`);
		}

		if (opener !== GROUP_BLOCK_DELIMITER.opener) {
			if (opener === documentBlockInstructionByType.module.start) {
				throw new Error(`Parse error at line ${i + 1}: module blocks must be inside a group block`);
			}
			i = readDocumentBlock(i);
			continue;
		}

		const groupName = getGroupName(trimmed, i + 1);
		if (seenGroupNames.has(groupName)) {
			throw new Error(`Parse error at line ${i + 1}: duplicate group "${groupName}"`);
		}
		seenGroupNames.add(groupName);
		i += 1;

		let groupClosed = false;
		while (i < lines.length) {
			const groupLine = lines[i];
			const groupTrimmed = groupLine.trim();

			if (groupTrimmed === '') {
				i += 1;
				continue;
			}

			const closer = getProjectCloserKeyword(groupTrimmed);
			if (closer === GROUP_BLOCK_DELIMITER.closer) {
				groupClosed = true;
				i += 1;
				break;
			}
			if (closer) {
				throw new Error(`Parse error at line ${i + 1}: closer "${closer}" does not match opener "group"`);
			}

			const innerOpener = getProjectOpenerKeyword(groupTrimmed);
			if (innerOpener !== documentBlockInstructionByType.module.start) {
				throw new Error(
					`Parse error at line ${i + 1}: group "${groupName}" can only contain module blocks, got "${groupTrimmed}"`
				);
			}

			i = readDocumentBlock(i, groupName);
		}

		if (!groupClosed) {
			throw new Error(`Parse error: unclosed block with opener "group"`);
		}
	}

	return { codeBlocks };
}

export function pickProjectCompilerBlocks(blocks: ProjectCodeBlock[]): ProjectCompilerBlocks {
	const groups: Record<string, Module[]> = { main: [] };
	const constantsBlocks: Module[] = [];
	const functionBlocks: Module[] = [];
	const macroBlocks: Module[] = [];

	for (const block of blocks) {
		if (block.disabled) {
			continue;
		}

		const blockType = getProjectBlockType(block.code);
		if (blockType === moduleBlockType) {
			const groupName = block.executionGroupName ?? 'main';
			groups[groupName] ??= [];
			groups[groupName].push({ code: block.code });
			continue;
		}
		if (blockType === documentBlockInstructionByType.constants.type) {
			constantsBlocks.push({ code: block.code });
			continue;
		}
		if (blockType === functionBlockType) {
			functionBlocks.push({ code: block.code });
			continue;
		}
		if (blockType === macroBlockType) {
			macroBlocks.push({ code: block.code });
		}
	}

	return { groups, constantsBlocks, functionBlocks, macroBlocks };
}
