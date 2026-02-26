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
] as const;

const CLOSERS = [
	'moduleEnd',
	'functionEnd',
	'configEnd',
	'constantsEnd',
	'defineMacroEnd',
	'vertexShaderEnd',
	'fragmentShaderEnd',
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

		it('serializes multiple code blocks separated by blank lines', () => {
			const project = {
				codeBlocks: [{ code: validBlock }, { code: validConfigBlock }],
			};
			const result = serializeProjectTo8f4e(project);
			expect(result).toContain('\n\n');
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
}
