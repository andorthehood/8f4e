import { describe, expect, it } from 'vitest';

import { getDocumentProjectBlockType, getProjectBlockType, parse8f4eProject, pickProjectCompilerBlocks } from '.';

const validModuleBlock = ['module counter', '', 'int count', '', 'moduleEnd'];
const validFunctionBlock = ['function sine', 'param float x', 'functionEnd float'];
const validMacroBlock = ['defineMacro double', 'push 2', 'mul', 'defineMacroEnd'];
const validPrototypeBlock = ['prototype oscillatorState', 'float phase', 'float frequency 440', 'prototypeEnd'];
const validNoteBlock = ['note', '; @pos 2 3', 'remember to tune this later', 'noteEnd'];

describe('parse8f4eProject', () => {
	it('parses multiple document blocks', () => {
		const text = [
			'8f4e/v1',
			'',
			'; project comment before an entry',
			'entry main',
			'; entry comment before a module',
			...validModuleBlock,
			'// entry comment before closing',
			'entryEnd',
			'',
			'# project directive-style comment before a function',
			...validFunctionBlock,
			'',
			...validPrototypeBlock,
			'',
			...validNoteBlock,
			'; trailing project comment',
		].join('\n');
		const project = parse8f4eProject(text);

		expect(project.codeBlocks).toEqual([
			{ code: validModuleBlock, entry: 'main' },
			{ code: validFunctionBlock },
			{ code: validPrototypeBlock },
			{ code: validNoteBlock },
		]);
	});

	it('marks parsed module blocks that contain shape instructions', () => {
		const project = parse8f4eProject(
			['8f4e/v1', '', 'entry main', 'module oscillator', 'shape oscillatorState', 'moduleEnd', 'entryEnd'].join('\n')
		);

		expect(project.codeBlocks[0]).toEqual({
			code: ['module oscillator', 'shape oscillatorState', 'moduleEnd'],
			entry: 'main',
		});
	});

	it('allows empty entries', () => {
		const project = parse8f4eProject(['8f4e/v1', '', 'entry main', 'entryEnd'].join('\n'));

		expect(project.codeBlocks).toEqual([]);
	});

	it('parses empty files with only a header', () => {
		expect(parse8f4eProject('8f4e/v1\n').codeBlocks).toEqual([]);
	});

	it('throws on invalid project shape', () => {
		expect(() => parse8f4eProject('wrong-header\nmodule foo\nmoduleEnd')).toThrow('Invalid .8f4e file');
		expect(() => parse8f4eProject('8f4e/v1\n\nentry main\nmodule foo\nsome code')).toThrow('unclosed block');
		expect(() => parse8f4eProject('8f4e/v1\n\nentry main\nmodule foo\nfunctionEnd')).toThrow('does not match opener');
		expect(() => parse8f4eProject('8f4e/v1\n\nunexpectedContent')).toThrow('expected opener keyword');
		expect(() => parse8f4eProject('8f4e/v1\n\nmodule foo\nmoduleEnd')).toThrow(
			'module blocks must be inside an entry block'
		);
		expect(() =>
			parse8f4eProject('8f4e/v1\n\nentry main\nmodule foo\nfunction bar\nfunctionEnd\nmoduleEnd\nentryEnd')
		).toThrow('mixed block type markers');
		expect(() => parse8f4eProject('8f4e/v1\n\nentry main\nfunction foo\nfunctionEnd\nentryEnd')).toThrow(
			'can only contain module blocks'
		);
		expect(() => parse8f4eProject('8f4e/v1\n\nentry main\nentryEnd\n\nentry main\nentryEnd')).toThrow(
			'duplicate entry'
		);
	});
});

describe('project block classification', () => {
	it('detects document block types', () => {
		expect(getDocumentProjectBlockType(validModuleBlock)).toBe('module');
		expect(getDocumentProjectBlockType(validFunctionBlock)).toBe('function');
		expect(getDocumentProjectBlockType(['constants', 'constantsEnd'])).toBe('constants');
		expect(getDocumentProjectBlockType(validMacroBlock)).toBe('macro');
		expect(getDocumentProjectBlockType(validPrototypeBlock)).toBe('prototype');
		expect(getDocumentProjectBlockType(validNoteBlock)).toBe('note');
		expect(getDocumentProjectBlockType(['module foo', 'functionEnd', 'moduleEnd'])).toBe('unknown');
	});

	it('detects compiler input block types', () => {
		expect(getProjectBlockType(validModuleBlock)).toBe('module');
		expect(getProjectBlockType(validFunctionBlock)).toBe('function');
		expect(getProjectBlockType(['constants', 'constantsEnd'])).toBe('constants');
		expect(getProjectBlockType(validMacroBlock)).toBe('macro');
		expect(getProjectBlockType(validPrototypeBlock)).toBe('prototype');
		expect(getProjectBlockType(validNoteBlock)).toBe('unknown');
	});

	it('splits project blocks into compiler inputs', () => {
		const blocks = [
			{ code: validModuleBlock, entry: 'main' },
			{ code: validFunctionBlock },
			{ code: validPrototypeBlock },
			{ code: validMacroBlock },
			{ code: validNoteBlock },
			{ code: validModuleBlock, entry: 'main', disabled: true },
		];

		expect(pickProjectCompilerBlocks(blocks)).toEqual({
			entries: { main: [{ code: validModuleBlock }] },
			constantsBlocks: [],
			functionBlocks: [{ code: validFunctionBlock }],
			prototypeBlocks: [{ code: validPrototypeBlock }],
			macroBlocks: [{ code: validMacroBlock }],
		});
	});

	it('splits modules into their execution entries', () => {
		expect(
			pickProjectCompilerBlocks([
				{ code: validModuleBlock, entry: 'main' },
				{ code: ['module other', 'moduleEnd'], entry: 'test' },
			]).entries
		).toEqual({
			main: [{ code: validModuleBlock }],
			test: [{ code: ['module other', 'moduleEnd'] }],
		});
	});

	it('does not infer execution entries from module directives', () => {
		expect(pickProjectCompilerBlocks([{ code: ['module regular', 'moduleEnd'], entry: 'main' }]).entries).toEqual({
			main: [{ code: ['module regular', 'moduleEnd'] }],
		});
	});

	it('rejects module blocks without an entry', () => {
		expect(() => pickProjectCompilerBlocks([{ code: validModuleBlock }])).toThrow('missing entry');
	});
});
