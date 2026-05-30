import { parse8f4eProject } from '@8f4e/tokenizer';

import { DEFAULT_PROJECT_ENTRY_NAME } from '../project/projectBlocks';

import type { Project } from '@8f4e/editor-state-types';

/**
 * Parses .8f4e text format into a Project.
 * Throws if the text is not valid .8f4e format.
 */
export function parse8f4eToProject(text: string): Project {
	const parsed = parse8f4eProject(text);
	const project: Project = {
		global: [],
		entries: {
			[DEFAULT_PROJECT_ENTRY_NAME]: [],
		},
	};

	for (const block of parsed.codeBlocks) {
		if (block.executionEntryName) {
			project.entries[block.executionEntryName] ??= [];
			project.entries[block.executionEntryName].push({ code: block.code });
			continue;
		}

		project.global.push({ code: block.code });
	}

	return project;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	const validBlock = ['module counter', '', 'int count', '', 'moduleEnd'];
	const validFunctionBlock = ['function sine', 'param float x', 'functionEnd float'];
	const validNoteBlock = ['note', '; @pos 2 3', 'remember to tune this later', 'noteEnd'];

	describe('parse8f4eToProject', () => {
		it('parses a valid .8f4e text with one block', () => {
			const text = '8f4e/v1\n\nentry main\n' + validBlock.join('\n') + '\nentryEnd';
			const project = parse8f4eToProject(text);
			expect(project.entries.main).toHaveLength(1);
			expect(project.entries.main[0]).toEqual({ code: validBlock });
		});

		it('parses multiple blocks', () => {
			const text = '8f4e/v1\n\nentry main\n' + validBlock.join('\n') + '\nentryEnd\n\n' + validFunctionBlock.join('\n');
			const project = parse8f4eToProject(text);
			expect(project.entries.main).toHaveLength(1);
			expect(project.global).toHaveLength(1);
		});

		it('parses note blocks', () => {
			const text = '8f4e/v1\n\n' + validNoteBlock.join('\n');
			const project = parse8f4eToProject(text);
			expect(project.global).toHaveLength(1);
			expect(project.global[0].code).toEqual(validNoteBlock);
		});

		it('parses empty file (header only)', () => {
			const project = parse8f4eToProject('8f4e/v1\n');
			expect(project).toEqual({ global: [], entries: { main: [] } });
		});

		it('throws on invalid header', () => {
			expect(() => parse8f4eToProject('wrong-header\nmodule foo\nmoduleEnd')).toThrow('Invalid .8f4e file');
		});

		it('throws on unclosed block', () => {
			expect(() => parse8f4eToProject('8f4e/v1\n\nentry main\nmodule foo\nsome code')).toThrow('unclosed block');
		});

		it('throws on mismatched closer', () => {
			expect(() => parse8f4eToProject('8f4e/v1\n\nentry main\nmodule foo\nfunctionEnd')).toThrow(
				'does not match opener'
			);
		});

		it('throws on non-opener content outside block', () => {
			expect(() => parse8f4eToProject('8f4e/v1\n\nunexpectedContent')).toThrow('expected opener keyword');
		});

		it('throws on mixed openers inside block', () => {
			expect(() =>
				parse8f4eToProject('8f4e/v1\n\nentry main\nmodule foo\nfunction bar\nfunctionEnd\nmoduleEnd\nentryEnd')
			).toThrow('mixed block type markers');
		});

		it('round-trips through serialize then parse', async () => {
			const { serializeProjectTo8f4e } = await import('../project-export/serializeTo8f4e');
			const project = {
				global: [{ code: validFunctionBlock }, { code: validNoteBlock }],
				entries: {
					main: [{ code: validBlock }],
				},
			};
			const text = serializeProjectTo8f4e(project);
			const parsed = parse8f4eToProject(text);
			expect(parsed.entries.main[0]).toEqual({ code: validBlock });
			expect(parsed.global[0].code).toEqual(validFunctionBlock);
			expect(parsed.global[1].code).toEqual(validNoteBlock);
		});
	});
}
