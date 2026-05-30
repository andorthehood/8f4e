import { getDocumentProjectBlockType } from '@8f4e/tokenizer';

import { FORMAT_HEADER, getCloserKeyword, getExpectedCloserPrefix, getOpenerKeyword } from '../project-format';
import { DEFAULT_PROJECT_ENTRY_NAME } from '../project/projectBlocks';

import type { Project } from '@8f4e/editor-state-types';

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
	const blockStrings: string[] = [];

	project.global.forEach((block, blockIndex) => {
		validateCodeBlock(block.code, blockIndex);
		if (getDocumentProjectBlockType(block.code) === 'module') {
			throw new Error(`Global block ${blockIndex}: module blocks must be nested under entries`);
		}
		blockStrings.push(block.code.join('\n'));
	});

	let entryBlockIndex = 0;
	const entries = Object.entries(project.entries);
	if (entries.length === 0) {
		entries.push([DEFAULT_PROJECT_ENTRY_NAME, []]);
	}

	for (const [entryName, modules] of entries) {
		for (const moduleBlock of modules) {
			validateCodeBlock(moduleBlock.code, entryBlockIndex);
			if (getDocumentProjectBlockType(moduleBlock.code) !== 'module') {
				throw new Error(`Entry "${entryName}" block ${entryBlockIndex}: entries can only contain module blocks`);
			}

			entryBlockIndex++;
		}

		blockStrings.push(
			['entry ' + entryName, ...modules.flatMap(moduleBlock => moduleBlock.code), 'entryEnd'].join('\n')
		);
	}

	return FORMAT_HEADER + '\n\n' + blockStrings.join('\n\n');
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const validBlock = ['module counter', '', 'int count', '', 'moduleEnd'];
	const validFunctionBlock = ['function sine', 'param float x', 'functionEnd float'];
	const validNoteBlock = ['note', '; @pos 1 2', 'compiler should ignore this', 'noteEnd'];

	describe('serializeProjectTo8f4e', () => {
		it('produces 8f4e/v1 header', () => {
			const project = { global: [], entries: { main: [{ code: validBlock }] } };
			const result = serializeProjectTo8f4e(project);
			expect(result.startsWith('8f4e/v1\n')).toBe(true);
		});

		it('serializes multiple code blocks separated by blank lines', () => {
			const project = {
				global: [{ code: validFunctionBlock }, { code: validNoteBlock }],
				entries: { main: [{ code: validBlock }] },
			};
			const result = serializeProjectTo8f4e(project);
			expect(result).toContain('\n\n');
			expect(result).toContain('entry main\nmodule counter');
			expect(result).toContain('moduleEnd\nentryEnd');
		});

		it('serializes global blocks before entries', () => {
			const project = {
				global: [{ code: validFunctionBlock }],
				entries: {
					main: [{ code: ['module a', 'moduleEnd'] }, { code: ['module c', 'moduleEnd'] }],
					test: [{ code: ['module b', 'moduleEnd'] }],
				},
			};

			expect(serializeProjectTo8f4e(project)).toBe(
				[
					'8f4e/v1',
					'',
					...validFunctionBlock,
					'',
					'entry main',
					'module a',
					'moduleEnd',
					'module c',
					'moduleEnd',
					'entryEnd',
					'',
					'entry test',
					'module b',
					'moduleEnd',
					'entryEnd',
				].join('\n')
			);
		});

		it('accepts note blocks', () => {
			const project = { global: [{ code: validNoteBlock }], entries: { main: [] } };
			expect(() => serializeProjectTo8f4e(project)).not.toThrow();
		});

		it('handles empty project entries', () => {
			const project = { global: [], entries: { main: [] } };
			const result = serializeProjectTo8f4e(project);
			expect(result).toBe('8f4e/v1\n\nentry main\nentryEnd');
		});

		it('accepts functionEnd with type suffix', () => {
			const project = { global: [{ code: validFunctionBlock }], entries: { main: [] } };
			expect(() => serializeProjectTo8f4e(project)).not.toThrow();
		});

		it('throws on missing opener', () => {
			const project = { global: [{ code: ['unknownToken', 'moduleEnd'] }], entries: { main: [] } };
			expect(() => serializeProjectTo8f4e(project)).toThrow('unknown or missing opener');
		});

		it('throws on missing closer', () => {
			const project = { global: [], entries: { main: [{ code: ['module foo', 'some code'] }] } };
			expect(() => serializeProjectTo8f4e(project)).toThrow('unknown or missing closer');
		});

		it('throws on opener/closer mismatch', () => {
			const project = { global: [], entries: { main: [{ code: ['module foo', 'functionEnd'] }] } };
			expect(() => serializeProjectTo8f4e(project)).toThrow('opener/closer mismatch');
		});

		it('throws on mixed block type markers', () => {
			const project = {
				global: [],
				entries: { main: [{ code: ['module foo', 'function bar', 'functionEnd', 'moduleEnd'] }] },
			};
			expect(() => serializeProjectTo8f4e(project)).toThrow('mixed block type markers');
		});

		it('throws on closer not at end of block', () => {
			const project = {
				global: [],
				entries: { main: [{ code: ['module foo', 'moduleEnd', 'extra line', 'moduleEnd'] }] },
			};
			expect(() => serializeProjectTo8f4e(project)).toThrow('not at the end of the block');
		});

		it('ignores trailing empty lines when finding closer', () => {
			const project = { global: [], entries: { main: [{ code: ['module foo', 'moduleEnd', '', ''] }] } };
			expect(() => serializeProjectTo8f4e(project)).not.toThrow();
		});
	});
}
