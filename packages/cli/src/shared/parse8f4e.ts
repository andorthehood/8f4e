import { documentBlockInstructionPairs } from '@8f4e/compiler-spec';

import type { ProjectInput } from './types';

const FORMAT_HEADER = '8f4e/v1';

const closerByOpener = new Map<string, string>(documentBlockInstructionPairs.map(({ start, end }) => [start, end]));
const openerByCloser = new Map<string, string>(documentBlockInstructionPairs.map(({ start, end }) => [end, start]));

function getOpenerKeyword(line: string): string | null {
	for (const opener of closerByOpener.keys()) {
		if (line === opener || line.startsWith(opener + ' ')) {
			return opener;
		}
	}
	return null;
}

function getCloserKeyword(line: string): string | null {
	for (const closer of openerByCloser.keys()) {
		if (line === closer || line.startsWith(closer + ' ')) {
			return closer;
		}
	}
	return null;
}

export default function parse8f4eToProject(text: string): ProjectInput {
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

			const opener = getOpenerKeyword(trimmed);
			if (!opener) {
				throw new Error(`Parse error at line ${i + 1}: expected opener keyword, got "${trimmed}"`);
			}

			openerKeyword = opener;
			currentBlockLines = [line];
			continue;
		}

		currentBlockLines.push(line);
		const closer = getCloserKeyword(trimmed);
		if (closer) {
			if (closer !== closerByOpener.get(openerKeyword ?? '')) {
				throw new Error(`Parse error at line ${i + 1}: closer "${closer}" does not match opener "${openerKeyword}"`);
			}

			codeBlocks.push({ code: currentBlockLines });
			currentBlockLines = null;
			openerKeyword = null;
			continue;
		}

		if (trimmed !== '') {
			const innerOpener = getOpenerKeyword(trimmed);
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
