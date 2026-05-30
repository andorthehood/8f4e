import { getDocumentProjectBlockType } from '@8f4e/tokenizer';

import { FORMAT_HEADER, getCloserKeyword, getExpectedCloserPrefix, getOpenerKeyword } from '../project-format';

import type { Project } from '@8f4e/editor-state-types';

const DEFAULT_PROJECT_ENTRY_NAME = 'main';

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

	const blockStrings: string[] = [];
	const emittedEntries = new Set<string>();
	const modulesByEntry = new Map<string, Project['codeBlocks']>();

	for (const block of codeBlocks) {
		if (getDocumentProjectBlockType(block.code) !== 'module') {
			continue;
		}

		const entryName = block.entry ?? DEFAULT_PROJECT_ENTRY_NAME;
		const entryModules = modulesByEntry.get(entryName) ?? [];
		entryModules.push(block);
		modulesByEntry.set(entryName, entryModules);
	}

	for (const block of codeBlocks) {
		if (getDocumentProjectBlockType(block.code) !== 'module') {
			blockStrings.push(block.code.join('\n'));
			continue;
		}

		const entryName = block.entry ?? DEFAULT_PROJECT_ENTRY_NAME;
		if (emittedEntries.has(entryName)) {
			continue;
		}

		emittedEntries.add(entryName);
		const modules = modulesByEntry.get(entryName) ?? [];
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
			const project = { codeBlocks: [{ code: validBlock }] };
			const result = serializeProjectTo8f4e(project);
			expect(result.startsWith('8f4e/v1\n')).toBe(true);
		});

		it('serializes multiple code blocks separated by blank lines', () => {
			const project = {
				codeBlocks: [{ code: validBlock }, { code: validFunctionBlock }, { code: validNoteBlock }],
			};
			const result = serializeProjectTo8f4e(project);
			expect(result).toContain('\n\n');
			expect(result).toContain('entry main\nmodule counter');
			expect(result).toContain('moduleEnd\nentryEnd');
		});

		it('serializes execution entries by first module position', () => {
			const project = {
				codeBlocks: [
					{ code: ['module a', 'moduleEnd'], entry: 'main' },
					{ code: validFunctionBlock },
					{ code: ['module b', 'moduleEnd'], entry: 'test' },
					{ code: ['module c', 'moduleEnd'], entry: 'main' },
				],
			};

			expect(serializeProjectTo8f4e(project)).toBe(
				[
					'8f4e/v1',
					'',
					'entry main',
					'module a',
					'moduleEnd',
					'module c',
					'moduleEnd',
					'entryEnd',
					'',
					...validFunctionBlock,
					'',
					'entry test',
					'module b',
					'moduleEnd',
					'entryEnd',
				].join('\n')
			);
		});

		it('accepts note blocks', () => {
			const project = { codeBlocks: [{ code: validNoteBlock }] };
			expect(() => serializeProjectTo8f4e(project)).not.toThrow();
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
			const project = { codeBlocks: [{ code: ['module foo', 'functionEnd'] }] };
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
