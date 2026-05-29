import { describe, expect, it } from 'vitest';

import {
	getDocumentProjectBlockType,
	getProjectBlockType,
	parse8f4eProject,
	pickProjectCompilerBlocks,
} from './project';

const validModuleBlock = ['module counter', '', 'int count', '', 'moduleEnd'];
const validFunctionBlock = ['function sine', 'param float x', 'functionEnd float'];
const validMacroBlock = ['defineMacro double', 'push 2', 'mul', 'defineMacroEnd'];
const validNoteBlock = ['note', '; @pos 2 3', 'remember to tune this later', 'noteEnd'];

describe('parse8f4eProject', () => {
	it('parses multiple document blocks', () => {
		const text = ['8f4e/v1', '', ...validModuleBlock, '', ...validFunctionBlock, '', ...validNoteBlock].join('\n');
		const project = parse8f4eProject(text);

		expect(project.codeBlocks.map(block => block.code)).toEqual([validModuleBlock, validFunctionBlock, validNoteBlock]);
	});

	it('parses empty files with only a header', () => {
		expect(parse8f4eProject('8f4e/v1\n').codeBlocks).toEqual([]);
	});

	it('throws on invalid project shape', () => {
		expect(() => parse8f4eProject('wrong-header\nmodule foo\nmoduleEnd')).toThrow('Invalid .8f4e file');
		expect(() => parse8f4eProject('8f4e/v1\n\nmodule foo\nsome code')).toThrow('unclosed block');
		expect(() => parse8f4eProject('8f4e/v1\n\nmodule foo\nfunctionEnd')).toThrow('does not match opener');
		expect(() => parse8f4eProject('8f4e/v1\n\nunexpectedContent')).toThrow('expected opener keyword');
		expect(() => parse8f4eProject('8f4e/v1\n\nmodule foo\nfunction bar\nfunctionEnd\nmoduleEnd')).toThrow(
			'mixed block type markers'
		);
	});
});

describe('project block classification', () => {
	it('detects document block types', () => {
		expect(getDocumentProjectBlockType(validModuleBlock)).toBe('module');
		expect(getDocumentProjectBlockType(validFunctionBlock)).toBe('function');
		expect(getDocumentProjectBlockType(['constants', 'constantsEnd'])).toBe('constants');
		expect(getDocumentProjectBlockType(validMacroBlock)).toBe('macro');
		expect(getDocumentProjectBlockType(validNoteBlock)).toBe('note');
		expect(getDocumentProjectBlockType(['module foo', 'functionEnd', 'moduleEnd'])).toBe('unknown');
	});

	it('detects compiler input block types', () => {
		expect(getProjectBlockType(validModuleBlock)).toBe('module');
		expect(getProjectBlockType(validFunctionBlock)).toBe('function');
		expect(getProjectBlockType(['constants', 'constantsEnd'])).toBe('constants');
		expect(getProjectBlockType(validMacroBlock)).toBe('macro');
		expect(getProjectBlockType(validNoteBlock)).toBe('unknown');
	});

	it('splits project blocks into compiler inputs', () => {
		const blocks = [
			{ code: validModuleBlock },
			{ code: validFunctionBlock },
			{ code: validMacroBlock },
			{ code: validNoteBlock },
			{ code: validModuleBlock, disabled: true },
		];

		expect(pickProjectCompilerBlocks(blocks)).toEqual({
			groups: { main: [{ code: validModuleBlock }] },
			constantsBlocks: [],
			functionBlocks: [{ code: validFunctionBlock }],
			macroBlocks: [{ code: validMacroBlock }],
		});
	});
});
