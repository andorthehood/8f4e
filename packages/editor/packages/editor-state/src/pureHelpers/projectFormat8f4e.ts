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

function validateCodeBlock(code: string[], blockIndex: number): void {
	// Find first non-empty line (must be opener)
	const firstNonEmptyLine = code.find(line => line.trim() !== '');
	if (!firstNonEmptyLine) {
		throw new Error(`Block ${blockIndex}: block has no content`);
	}

	const opener = getOpenerKeyword(firstNonEmptyLine.trim());
	if (!opener) {
		throw new Error(`Block ${blockIndex}: unknown or missing opener "${firstNonEmptyLine.trim()}"`);
	}

	const expectedCloserPrefix = getExpectedCloserPrefix(opener);
	const firstLineIndex = code.indexOf(firstNonEmptyLine);

	// Find last non-empty line (must be matching closer)
	let lastNonEmptyIndex = code.length - 1;
	while (lastNonEmptyIndex >= 0 && code[lastNonEmptyIndex].trim() === '') {
		lastNonEmptyIndex--;
	}

	if (lastNonEmptyIndex < 0) {
		throw new Error(`Block ${blockIndex}: missing closer`);
	}

	const closerLine = code[lastNonEmptyIndex].trim();
	const closer = getCloserKeyword(closerLine);
	if (!closer) {
		throw new Error(`Block ${blockIndex}: unknown or missing closer "${closerLine}"`);
	}

	if (!closer.startsWith(expectedCloserPrefix)) {
		throw new Error(`Block ${blockIndex}: opener/closer mismatch (opener "${opener}", closer "${closer}")`);
	}

	// Scan inside block for mixed markers or early closer
	for (let i = firstLineIndex + 1; i < lastNonEmptyIndex; i++) {
		const lineTrimmed = code[i].trim();
		if (lineTrimmed === '') continue;

		const innerOpener = getOpenerKeyword(lineTrimmed);
		if (innerOpener) {
			throw new Error(
				`Block ${blockIndex}: mixed block type markers (found opener "${lineTrimmed}" inside "${opener}" block)`
			);
		}

		const innerCloser = getCloserKeyword(lineTrimmed);
		if (innerCloser) {
			throw new Error(`Block ${blockIndex}: closer "${lineTrimmed}" is not at the end of the block`);
		}
	}
}

/**
 * Serializes a Project to .8f4e text format.
 * Throws if any code block fails export-gate validation.
 */
export function serializeProjectTo8f4e(project: Project): string {
	const { codeBlocks } = project;

	for (let i = 0; i < codeBlocks.length; i++) {
		validateCodeBlock(codeBlocks[i].code, i);
	}

	const blockStrings = codeBlocks.map(block => block.code.join('\n'));
	return FORMAT_HEADER + '\n\n' + blockStrings.join('\n\n');
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

	describe('serializeProjectTo8f4e', () => {
		it('produces 8f4e/v1 header', () => {
			const project = { codeBlocks: [{ code: validBlock }] };
			const result = serializeProjectTo8f4e(project);
			expect(result.startsWith('8f4e/v1\n')).toBe(true);
		});

		it('serializes multiple code blocks that can be round-tripped back', () => {
			const project = {
				codeBlocks: [{ code: validBlock }, { code: validConfigBlock }],
			};
			const result = serializeProjectTo8f4e(project);
			expect(result).toContain('\n\n');
			const parsed = parse8f4eToProject(result);
			expect(parsed.codeBlocks).toHaveLength(2);
		});

		it('handles empty codeBlocks array', () => {
			const project = { codeBlocks: [] };
			const result = serializeProjectTo8f4e(project);
			expect(result).toBe('8f4e/v1\n\n');
		});

		it('accepts functionEnd with type suffix', () => {
			const project = { codeBlocks: [{ code: validFunctionBlock }] };
			expect(() => serializeProjectTo8f4e(project)).not.toThrow();
		});

		it('throws on missing opener', () => {
			const project = { codeBlocks: [{ code: ['unknownToken', 'moduleEnd'] }] };
			expect(() => serializeProjectTo8f4e(project)).toThrow('unknown or missing opener');
		});

		it('throws on missing closer', () => {
			const project = { codeBlocks: [{ code: ['module foo', 'some code'] }] };
			expect(() => serializeProjectTo8f4e(project)).toThrow('unknown or missing closer');
		});

		it('throws on opener/closer mismatch', () => {
			const project = { codeBlocks: [{ code: ['module foo', 'configEnd'] }] };
			expect(() => serializeProjectTo8f4e(project)).toThrow('opener/closer mismatch');
		});

		it('throws on mixed block type markers', () => {
			const project = { codeBlocks: [{ code: ['module foo', 'function bar', 'functionEnd', 'moduleEnd'] }] };
			expect(() => serializeProjectTo8f4e(project)).toThrow('mixed block type markers');
		});

		it('throws on closer not at end of block', () => {
			const project = { codeBlocks: [{ code: ['module foo', 'moduleEnd', 'extra line', 'moduleEnd'] }] };
			expect(() => serializeProjectTo8f4e(project)).toThrow('not at the end of the block');
		});

		it('ignores trailing empty lines when finding closer', () => {
			const project = { codeBlocks: [{ code: ['module foo', 'moduleEnd', '', ''] }] };
			expect(() => serializeProjectTo8f4e(project)).not.toThrow();
		});
	});

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

		it('round-trips through serialize then parse', () => {
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
