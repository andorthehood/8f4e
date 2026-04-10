import { FORMAT_HEADER, getCloserKeyword, getExpectedCloserPrefix, getOpenerKeyword } from '../project-format';

import type { Project } from '~/types';

/**
 * Parses .8f4e text format into a Project.
 * Throws if the text is not valid .8f4e format.
 */
export function parse8f4eToProject(text: string): Project {
	const lines = text.split('\n');

	if (lines[0]?.trim() !== FORMAT_HEADER) {
		throw new Error(`Invalid .8f4e file: expected header "${FORMAT_HEADER}", got "${lines[0]?.trim() ?? ''}"`);
	}

	const codeBlocks: Array<{ code: string[] }> = [];
	let currentBlockLines: string[] | null = null;
	let openerKeyword: string | null = null;

	for (let i = 1; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		if (currentBlockLines === null) {
			// Outside a block: skip blank lines, expect opener
			if (trimmed === '') {
				continue;
			}

			const opener = getOpenerKeyword(trimmed);
			if (!opener) {
				throw new Error(`Parse error at line ${i + 1}: expected opener keyword, got "${trimmed}"`);
			}

			openerKeyword = opener;
			currentBlockLines = [line];
		} else {
			// Inside a block: accumulate lines, watch for closer
			currentBlockLines.push(line);

			const closer = getCloserKeyword(trimmed);
			if (closer) {
				const expectedCloserPrefix = getExpectedCloserPrefix(openerKeyword!);
				if (!closer.startsWith(expectedCloserPrefix)) {
					throw new Error(`Parse error at line ${i + 1}: closer "${closer}" does not match opener "${openerKeyword}"`);
				}

				codeBlocks.push({ code: currentBlockLines });
				currentBlockLines = null;
				openerKeyword = null;
			} else if (trimmed !== '') {
				// Check for mixed openers inside the block
				const innerOpener = getOpenerKeyword(trimmed);
				if (innerOpener) {
					throw new Error(
						`Parse error at line ${i + 1}: mixed block type markers (found opener "${trimmed}" inside "${openerKeyword}" block)`
					);
				}
			}
		}
	}

	if (currentBlockLines !== null) {
		throw new Error(`Parse error: unclosed block with opener "${openerKeyword}"`);
	}

	return { codeBlocks };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const validBlock = ['module counter', '', 'int count', '', 'moduleEnd'];
	const validFunctionBlock = ['function sine', 'param float x', 'functionEnd float'];
	const validNoteBlock = ['note', '; @pos 2 3', 'remember to tune this later', 'noteEnd'];

	describe('parse8f4eToProject', () => {
		it('parses a valid .8f4e text with one block', () => {
			const text = '8f4e/v1\n\n' + validBlock.join('\n');
			const project = parse8f4eToProject(text);
			expect(project.codeBlocks).toHaveLength(1);
			expect(project.codeBlocks[0].code).toEqual(validBlock);
		});

		it('parses multiple blocks', () => {
			const text = '8f4e/v1\n\n' + validBlock.join('\n') + '\n\n' + validFunctionBlock.join('\n');
			const project = parse8f4eToProject(text);
			expect(project.codeBlocks).toHaveLength(2);
		});

		it('parses note blocks', () => {
			const text = '8f4e/v1\n\n' + validNoteBlock.join('\n');
			const project = parse8f4eToProject(text);
			expect(project.codeBlocks).toHaveLength(1);
			expect(project.codeBlocks[0].code).toEqual(validNoteBlock);
		});

		it('parses empty file (header only)', () => {
			const project = parse8f4eToProject('8f4e/v1\n');
			expect(project.codeBlocks).toHaveLength(0);
		});

		it('throws on invalid header', () => {
			expect(() => parse8f4eToProject('wrong-header\nmodule foo\nmoduleEnd')).toThrow('Invalid .8f4e file');
		});

		it('throws on unclosed block', () => {
			expect(() => parse8f4eToProject('8f4e/v1\n\nmodule foo\nsome code')).toThrow('unclosed block');
		});

		it('throws on mismatched closer', () => {
			expect(() => parse8f4eToProject('8f4e/v1\n\nmodule foo\nfunctionEnd')).toThrow('does not match opener');
		});

		it('throws on non-opener content outside block', () => {
			expect(() => parse8f4eToProject('8f4e/v1\n\nunexpectedContent')).toThrow('expected opener keyword');
		});

		it('throws on mixed openers inside block', () => {
			expect(() => parse8f4eToProject('8f4e/v1\n\nmodule foo\nfunction bar\nfunctionEnd\nmoduleEnd')).toThrow(
				'mixed block type markers'
			);
		});

		it('round-trips through serialize then parse', async () => {
			const { serializeProjectTo8f4e } = await import('../project-export/serializeTo8f4e');
			const project = {
				codeBlocks: [{ code: validBlock }, { code: validFunctionBlock }, { code: validNoteBlock }],
			};
			const text = serializeProjectTo8f4e(project);
			const parsed = parse8f4eToProject(text);
			expect(parsed.codeBlocks).toHaveLength(3);
			expect(parsed.codeBlocks[0].code).toEqual(validBlock);
			expect(parsed.codeBlocks[1].code).toEqual(validFunctionBlock);
			expect(parsed.codeBlocks[2].code).toEqual(validNoteBlock);
		});
	});
}
