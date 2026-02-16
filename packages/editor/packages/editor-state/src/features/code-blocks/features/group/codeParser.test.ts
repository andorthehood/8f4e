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
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', sticky: false });
	});

	it('should return group name when @group is on first line', () => {
		const code = ['; @group firstGroup', 'module test', 'output out 1', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'firstGroup', sticky: false });
	});

	it('should return group name when @group is on last line', () => {
		const code = ['module test', 'output out 1', 'moduleEnd', '; @group lastGroup'];
		expect(parseGroup(code)).toEqual({ groupName: 'lastGroup', sticky: false });
	});

	it('should handle @group with extra whitespace', () => {
		const code = ['module test', ';   @group   spaceGroup', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'spaceGroup', sticky: false });
	});

	it('should handle @group with leading whitespace', () => {
		const code = ['module test', '  ; @group leadGroup', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'leadGroup', sticky: false });
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
		expect(parseGroup(code)).toEqual({ groupName: 'firstGroup', sticky: false });
	});

	it('should not match @groupOther (strict word boundary)', () => {
		const code = ['module test', '; @groupOther notGroup', 'moduleEnd'];
		expect(parseGroup(code)).toBe(undefined);
	});

	it('should extract only the first token as group name', () => {
		const code = ['module test', '; @group myGroup extra text here', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', sticky: false });
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
		expect(parseGroup(['function test', '; @group funcGroup', 'functionEnd'])).toEqual({
			groupName: 'funcGroup',
			sticky: false,
		});
		expect(parseGroup(['comment', '; @group commentGroup', 'commentEnd'])).toEqual({
			groupName: 'commentGroup',
			sticky: false,
		});
		expect(parseGroup(['vertexShader postprocess', '; @group shaderGroup', 'vertexShaderEnd'])).toEqual({
			groupName: 'shaderGroup',
			sticky: false,
		});
	});

	it('should handle group names with hyphens', () => {
		const code = ['module test', '; @group audio-chain-1', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'audio-chain-1', sticky: false });
	});

	it('should handle group names with underscores', () => {
		const code = ['module test', '; @group audio_chain_1', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'audio_chain_1', sticky: false });
	});

	it('should handle alphanumeric group names', () => {
		const code = ['module test', '; @group group123', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'group123', sticky: false });
	});

	// New tests for sticky functionality
	it('should parse sticky flag when present', () => {
		const code = ['module test', '; @group myGroup sticky', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', sticky: true });
	});

	it('should parse sticky flag with extra whitespace', () => {
		const code = ['module test', '; @group myGroup   sticky', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', sticky: true });
	});

	it('should ignore third token after sticky', () => {
		const code = ['module test', '; @group myGroup sticky extra', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', sticky: true });
	});

	it('should not set sticky for non-sticky second argument', () => {
		const code = ['module test', '; @group myGroup lock', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', sticky: false });
	});

	it('should not set sticky for invalid second argument', () => {
		const code = ['module test', '; @group myGroup other', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', sticky: false });
	});

	it('should be case sensitive for sticky keyword', () => {
		const code = ['module test', '; @group myGroup Sticky', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', sticky: false });
	});

	it('should be case sensitive for sticky keyword uppercase', () => {
		const code = ['module test', '; @group myGroup STICKY', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', sticky: false });
	});
});
