import type { Project } from '~/types';

const FORMAT_HEADER = '8f4e/v1';

const OPENERS = [
	'module',
	'function',
	'config',
	'constants',
	'defineMacro',
	'vertexShader',
	'fragmentShader',
	'comment',
] as const;

const CLOSERS = [
	'moduleEnd',
	'functionEnd',
	'configEnd',
	'constantsEnd',
	'defineMacroEnd',
	'vertexShaderEnd',
	'fragmentShaderEnd',
	'commentEnd',
] as const;

function getOpenerKeyword(line: string): string | null {
	for (const opener of OPENERS) {
		if (line === opener || line.startsWith(opener + ' ')) {
			return opener;
		}
	}
	return null;
}

function getCloserKeyword(line: string): string | null {
	for (const closer of CLOSERS) {
		if (line === closer || line.startsWith(closer + ' ')) {
			return closer;
		}
	}
	return null;
}

function getExpectedCloserPrefix(opener: string): string {
	return opener + 'End';
}

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
	const validConfigBlock = ['config project', 'push 65536', 'configEnd'];
	const validFunctionBlock = ['function sine', 'param float x', 'functionEnd float'];

	describe('parse8f4eToProject', () => {
		it('parses a valid .8f4e text with one block', () => {
			const text = '8f4e/v1\n\n' + validBlock.join('\n');
			const project = parse8f4eToProject(text);
			expect(project.codeBlocks).toHaveLength(1);
			expect(project.codeBlocks[0].code).toEqual(validBlock);
		});

		it('parses multiple blocks', () => {
			const text = '8f4e/v1\n\n' + validBlock.join('\n') + '\n\n' + validConfigBlock.join('\n');
			const project = parse8f4eToProject(text);
			expect(project.codeBlocks).toHaveLength(2);
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
			expect(() => parse8f4eToProject('8f4e/v1\n\nmodule foo\nconfigEnd')).toThrow('does not match opener');
		});

		it('throws on non-opener content outside block', () => {
			expect(() => parse8f4eToProject('8f4e/v1\n\nunexpectedContent')).toThrow('expected opener keyword');
		});

		it('round-trips through serialize then parse', async () => {
			const { serializeProjectTo8f4e } = await import('../project-export/serializeTo8f4e');
			const project = {
				codeBlocks: [{ code: validBlock }, { code: validConfigBlock }, { code: validFunctionBlock }],
			};
			const text = serializeProjectTo8f4e(project);
			const parsed = parse8f4eToProject(text);
			expect(parsed.codeBlocks).toHaveLength(3);
			expect(parsed.codeBlocks[0].code).toEqual(validBlock);
			expect(parsed.codeBlocks[1].code).toEqual(validConfigBlock);
			expect(parsed.codeBlocks[2].code).toEqual(validFunctionBlock);
		});
	});
}
