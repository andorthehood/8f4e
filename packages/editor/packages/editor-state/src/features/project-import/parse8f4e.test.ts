import { describe, expect, it } from 'vitest';
import { parse8f4eToProject } from './parse8f4e';

const validBlock = ['module counter', '', 'int count', '', 'moduleEnd'];
const validFunctionBlock = ['function sine', 'param float x', 'functionEnd float'];
const validNoteBlock = ['note', '; @pos 2 3', 'remember to tune this later', 'noteEnd'];

describe('parse8f4eToProject', () => {
	it('parses a valid .8f4e text with one block', () => {
		const text = '8f4e/v1\n\nentry main\n' + validBlock.join('\n') + '\nentryEnd';
		const project = parse8f4eToProject(text);
		expect(project.modules).toHaveLength(1);
		expect(project.modules[0]).toEqual({ id: 4, code: validBlock, entry: 'main' });
	});

	it('parses multiple blocks', () => {
		const text = '8f4e/v1\n\nentry main\n' + validBlock.join('\n') + '\nentryEnd\n\n' + validFunctionBlock.join('\n');
		const project = parse8f4eToProject(text);
		expect(project.modules).toHaveLength(1);
		expect(project.functions).toHaveLength(1);
	});

	it('parses note blocks', () => {
		const text = '8f4e/v1\n\n' + validNoteBlock.join('\n');
		const project = parse8f4eToProject(text);
		expect(project.notes).toHaveLength(1);
		expect(project.notes[0]).toEqual({ id: 3, code: validNoteBlock });
	});

	it('parses top-level includes as a project code block', () => {
		const includesBlock = ['includes', 'include std/events/risingEdge', 'includesEnd'];
		const project = parse8f4eToProject(
			['8f4e/v1', '', ...includesBlock, '', 'entry main', ...validBlock, 'entryEnd'].join('\n')
		);

		expect(project.includes).toEqual([{ id: 3, code: includesBlock }]);
		expect(project.modules).toEqual([{ id: 8, code: validBlock, entry: 'main' }]);
		expect(project).not.toHaveProperty('includedFunctionBlocks');
	});

	it('parses empty file (header only)', () => {
		const project = parse8f4eToProject('8f4e/v1\n');
		expect(project).toEqual({
			modules: [],
			functions: [],
			constants: [],
			prototypes: [],
			includes: [],
			notes: [],
			unknown: [],
			groups: [],
		});
	});

	it('throws on invalid header', () => {
		expect(() => parse8f4eToProject('wrong-header\nmodule foo\nmoduleEnd')).toThrow('Invalid .8f4e file');
	});

	it('throws on unclosed block', () => {
		expect(() => parse8f4eToProject('8f4e/v1\n\nentry main\nmodule foo\nsome code')).toThrow('unclosed block');
	});

	it('throws on mismatched closer', () => {
		expect(() => parse8f4eToProject('8f4e/v1\n\nentry main\nmodule foo\nfunctionEnd')).toThrow('does not match opener');
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
			modules: [{ id: 1, code: validBlock, entry: 'main' }],
			functions: [{ id: 2, code: validFunctionBlock }],
			constants: [],
			prototypes: [],
			includes: [],
			notes: [{ id: 3, code: validNoteBlock }],
			unknown: [],
			groups: [],
		};
		const text = serializeProjectTo8f4e(project);
		const parsed = parse8f4eToProject(text);
		expect(parsed.modules[0].code).toEqual(validBlock);
		expect(parsed.functions[0].code).toEqual(validFunctionBlock);
		expect(parsed.notes[0].code).toEqual(validNoteBlock);
	});
});
