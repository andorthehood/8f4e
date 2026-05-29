import {
	compiledModuleBlockTypes,
	compilableBlockTypes,
	documentBlockInstructionByType,
	documentBlockInstructionPairs,
} from '@8f4e/compiler-spec';

import instructionParser from './syntax/instructionParser';

import type { CompilableBlockType, DocumentBlockType, Module } from '@8f4e/compiler-spec';

export const FORMAT_HEADER = '8f4e/v1';
export const BLOCK_DELIMITERS = documentBlockInstructionPairs.map(({ type, start, end }) => ({
	type,
	opener: start,
	closer: end,
}));

const blockDelimiters = compilableBlockTypes.map(type => documentBlockInstructionByType[type]);
const compiledModuleBlockTypeSet = new Set<string>(compiledModuleBlockTypes);
const functionBlockType = documentBlockInstructionByType.function.type;
const macroBlockType = documentBlockInstructionByType.macro.type;
const closerByOpener = new Map<string, string>(documentBlockInstructionPairs.map(({ start, end }) => [start, end]));
const openerByCloser = new Map<string, string>(documentBlockInstructionPairs.map(({ start, end }) => [end, start]));

export interface ProjectCodeBlock {
	code: string[];
	disabled?: boolean;
}

export interface ProjectInput {
	codeBlocks: ProjectCodeBlock[];
	[key: string]: unknown;
}

export interface ProjectCompilerBlocks {
	moduleBlocks: Module[];
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

export function isProjectTestModule(block: ProjectCodeBlock): boolean {
	if (getProjectBlockType(block.code) !== 'module') {
		return false;
	}

	return block.code.some(line => instructionParser.exec(line)?.[1] === '#test');
}

export function hasProjectTestModule(blocks: ProjectCodeBlock[]): boolean {
	return blocks.some(block => !block.disabled && isProjectTestModule(block));
}

export function parse8f4eProject(text: string): ProjectInput {
	const lines = text.split('\n');

	if (lines[0]?.trim() !== FORMAT_HEADER) {
		throw new Error(`Invalid .8f4e file: expected header "${FORMAT_HEADER}", got "${lines[0]?.trim() ?? ''}"`);
	}

	const codeBlocks: Array<{ code: string[] }> = [];
	let currentBlockLines: string[] | null = null;
	let openerKeyword: string | null = null;

	for (let i = 1; i < lines.length; i += 1) {
		const line = lines[i];
		const trimmed = line.trim();

		if (currentBlockLines === null) {
			if (trimmed === '') {
				continue;
			}

			const opener = getProjectOpenerKeyword(trimmed);
			if (!opener) {
				throw new Error(`Parse error at line ${i + 1}: expected opener keyword, got "${trimmed}"`);
			}

			openerKeyword = opener;
			currentBlockLines = [line];
			continue;
		}

		currentBlockLines.push(line);
		const closer = getProjectCloserKeyword(trimmed);
		if (closer) {
			if (closer !== getExpectedProjectCloserPrefix(openerKeyword ?? '')) {
				throw new Error(`Parse error at line ${i + 1}: closer "${closer}" does not match opener "${openerKeyword}"`);
			}

			codeBlocks.push({ code: currentBlockLines });
			currentBlockLines = null;
			openerKeyword = null;
			continue;
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

	if (currentBlockLines !== null) {
		throw new Error(`Parse error: unclosed block with opener "${openerKeyword}"`);
	}

	return { codeBlocks };
}

export function pickProjectCompilerBlocks(blocks: ProjectCodeBlock[]): ProjectCompilerBlocks {
	const moduleBlocks: Module[] = [];
	const functionBlocks: Module[] = [];
	const macroBlocks: Module[] = [];

	for (const block of blocks) {
		if (block.disabled) {
			continue;
		}

		const blockType = getProjectBlockType(block.code);
		if (compiledModuleBlockTypeSet.has(blockType)) {
			moduleBlocks.push({ code: block.code });
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

	return { moduleBlocks, functionBlocks, macroBlocks };
}
