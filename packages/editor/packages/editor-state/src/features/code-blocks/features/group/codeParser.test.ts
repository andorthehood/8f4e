import { describe, it, expect } from 'vitest';

import parseGroup from './codeParser';

describe('parseGroup', () => {
	it('should return undefined for empty code', () => {
		expect(parseGroup([])).toBe(undefined);
	});

	it('should return undefined for code without @group directive', () => {
		const code = ['module test', 'output out 1', 'moduleEnd'];
		expect(parseGroup(code)).toBe(undefined);
	});

	it('should return group name for code with @group directive', () => {
		const code = ['module test', '; @group myGroup', 'output out 1', 'moduleEnd'];
		expect(parseGroup(code)).toBe('myGroup');
	});

	it('should return group name when @group is on first line', () => {
		const code = ['; @group firstGroup', 'module test', 'output out 1', 'moduleEnd'];
		expect(parseGroup(code)).toBe('firstGroup');
	});

	it('should return group name when @group is on last line', () => {
		const code = ['module test', 'output out 1', 'moduleEnd', '; @group lastGroup'];
		expect(parseGroup(code)).toBe('lastGroup');
	});

	it('should handle @group with extra whitespace', () => {
		const code = ['module test', ';   @group   spaceGroup', 'moduleEnd'];
		expect(parseGroup(code)).toBe('spaceGroup');
	});

	it('should handle @group with leading whitespace', () => {
		const code = ['module test', '  ; @group leadGroup', 'moduleEnd'];
		expect(parseGroup(code)).toBe('leadGroup');
	});

	it('should not match @group in non-comment lines', () => {
		const code = ['module test', '@group notComment', 'moduleEnd'];
		expect(parseGroup(code)).toBe(undefined);
	});

	it('should not match hash-style comments', () => {
		const code = ['module test', '# @group hashComment', 'moduleEnd'];
		expect(parseGroup(code)).toBe(undefined);
	});

	it('should return first @group directive when multiple exist', () => {
		const code = ['module test', '; @group firstGroup', 'output out 1', '; @group secondGroup', 'moduleEnd'];
		expect(parseGroup(code)).toBe('firstGroup');
	});

	it('should not match @groupOther (strict word boundary)', () => {
		const code = ['module test', '; @groupOther notGroup', 'moduleEnd'];
		expect(parseGroup(code)).toBe(undefined);
	});

	it('should extract only the first token as group name', () => {
		const code = ['module test', '; @group myGroup extra text here', 'moduleEnd'];
		expect(parseGroup(code)).toBe('myGroup');
	});

	it('should return undefined if @group has no argument', () => {
		const code = ['module test', '; @group', 'moduleEnd'];
		expect(parseGroup(code)).toBe(undefined);
	});

	it('should return undefined if @group has only whitespace', () => {
		const code = ['module test', '; @group   ', 'moduleEnd'];
		expect(parseGroup(code)).toBe(undefined);
	});

	it('should work with different block types', () => {
		expect(parseGroup(['function test', '; @group funcGroup', 'functionEnd'])).toBe('funcGroup');
		expect(parseGroup(['comment', '; @group commentGroup', 'commentEnd'])).toBe('commentGroup');
		expect(parseGroup(['vertexShader postprocess', '; @group shaderGroup', 'vertexShaderEnd'])).toBe('shaderGroup');
	});

	it('should handle group names with hyphens', () => {
		const code = ['module test', '; @group audio-chain-1', 'moduleEnd'];
		expect(parseGroup(code)).toBe('audio-chain-1');
	});

	it('should handle group names with underscores', () => {
		const code = ['module test', '; @group audio_chain_1', 'moduleEnd'];
		expect(parseGroup(code)).toBe('audio_chain_1');
	});

	it('should handle alphanumeric group names', () => {
		const code = ['module test', '; @group group123', 'moduleEnd'];
		expect(parseGroup(code)).toBe('group123');
	});
});
