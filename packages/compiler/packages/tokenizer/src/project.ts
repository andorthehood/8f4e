import {
	compilableBlockTypes,
	documentBlockInstructionByType,
	documentBlockInstructionPairs,
} from '@8f4e/compiler-spec';

import type { CompilableBlockType, DocumentBlockType, Module } from '@8f4e/compiler-spec';

export const FORMAT_HEADER = '8f4e/v1';
export const ENTRY_BLOCK_DELIMITER = { type: 'entry', opener: 'entry', closer: 'entryEnd' } as const;
export const BLOCK_DELIMITERS = documentBlockInstructionPairs.map(({ type, start, end }) => ({
	type,
	opener: start,
	closer: end,
}));

const blockDelimiters = compilableBlockTypes.map(type => documentBlockInstructionByType[type]);
const projectBlockDelimiters = [
	...documentBlockInstructionPairs.map(({ start, end }) => ({ opener: start, closer: end })),
	{ opener: ENTRY_BLOCK_DELIMITER.opener, closer: ENTRY_BLOCK_DELIMITER.closer },
];
const functionBlockType = documentBlockInstructionByType.function.type;
const macroBlockType = documentBlockInstructionByType.macro.type;
const moduleBlockType = documentBlockInstructionByType.module.type;
const closerByOpener = new Map<string, string>(projectBlockDelimiters.map(({ opener, closer }) => [opener, closer]));
const openerByCloser = new Map<string, string>(projectBlockDelimiters.map(({ opener, closer }) => [closer, opener]));

export interface ProjectCodeBlock {
	code: string[];
	disabled?: boolean;
	entry?: string;
}

export interface ProjectInput {
	codeBlocks: ProjectCodeBlock[];
	[key: string]: unknown;
}

export interface ProjectCompilerBlocks {
	entries: Record<string, Module[]>;
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

function getEntryName(line: string, lineNumber: number): string {
	const [, ...args] = line.trim().split(/\s+/);
	const [entryName] = args;
	if (!entryName || args.length !== 1) {
		throw new Error(`Parse error at line ${lineNumber}: entry requires exactly one name`);
	}
	return entryName;
}

function isProjectGapLine(trimmedLine: string): boolean {
	return (
		trimmedLine === '' || trimmedLine.startsWith('#') || trimmedLine.startsWith(';') || trimmedLine.startsWith('//')
	);
}

export function getProjectBlockType(code: string[]): ProjectBlockType {
	for (const line of code) {
		const trimmed = line.trim();
		if (isProjectGapLine(trimmed)) {
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
	const seenEntryNames = new Set<string>();

	function readDocumentBlock(startIndex: number, entry?: string): number {
		const openerLine = lines[startIndex];
		const openerKeyword = getProjectOpenerKeyword(openerLine.trim());
		if (!openerKeyword || openerKeyword === ENTRY_BLOCK_DELIMITER.opener) {
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

				codeBlocks.push({ code: currentBlockLines, ...(entry ? { entry } : {}) });
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

		if (isProjectGapLine(trimmed)) {
			i += 1;
			continue;
		}

		const opener = getProjectOpenerKeyword(trimmed);
		if (!opener) {
			throw new Error(`Parse error at line ${i + 1}: expected opener keyword, got "${trimmed}"`);
		}

		if (opener !== ENTRY_BLOCK_DELIMITER.opener) {
			if (opener === documentBlockInstructionByType.module.start) {
				throw new Error(`Parse error at line ${i + 1}: module blocks must be inside an entry block`);
			}
			i = readDocumentBlock(i);
			continue;
		}

		const entryName = getEntryName(trimmed, i + 1);
		if (seenEntryNames.has(entryName)) {
			throw new Error(`Parse error at line ${i + 1}: duplicate entry "${entryName}"`);
		}
		seenEntryNames.add(entryName);
		i += 1;

		let entryClosed = false;
		while (i < lines.length) {
			const entryLine = lines[i];
			const entryTrimmed = entryLine.trim();

			if (isProjectGapLine(entryTrimmed)) {
				i += 1;
				continue;
			}

			const closer = getProjectCloserKeyword(entryTrimmed);
			if (closer === ENTRY_BLOCK_DELIMITER.closer) {
				entryClosed = true;
				i += 1;
				break;
			}
			if (closer) {
				throw new Error(`Parse error at line ${i + 1}: closer "${closer}" does not match opener "entry"`);
			}

			const innerOpener = getProjectOpenerKeyword(entryTrimmed);
			if (innerOpener !== documentBlockInstructionByType.module.start) {
				throw new Error(
					`Parse error at line ${i + 1}: entry "${entryName}" can only contain module blocks, got "${entryTrimmed}"`
				);
			}

			i = readDocumentBlock(i, entryName);
		}

		if (!entryClosed) {
			throw new Error(`Parse error: unclosed block with opener "entry"`);
		}
	}

	return { codeBlocks };
}

export function pickProjectCompilerBlocks(blocks: ProjectCodeBlock[]): ProjectCompilerBlocks {
	const entries: Record<string, Module[]> = { main: [] };
	const constantsBlocks: Module[] = [];
	const functionBlocks: Module[] = [];
	const macroBlocks: Module[] = [];

	for (const block of blocks) {
		if (block.disabled) {
			continue;
		}

		const blockType = getProjectBlockType(block.code);
		if (blockType === moduleBlockType) {
			if (!block.entry) {
				throw new Error('Project module block is missing entry');
			}
			const entryName = block.entry;
			entries[entryName] ??= [];
			entries[entryName].push({ code: block.code });
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

	return { entries, constantsBlocks, functionBlocks, macroBlocks };
}
