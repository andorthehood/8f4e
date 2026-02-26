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
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', nonstick: false });
	});

	it('should return group name when @group is on first line', () => {
		const code = ['; @group firstGroup', 'module test', 'output out 1', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'firstGroup', nonstick: false });
	});

	it('should return group name when @group is on last line', () => {
		const code = ['module test', 'output out 1', 'moduleEnd', '; @group lastGroup'];
		expect(parseGroup(code)).toEqual({ groupName: 'lastGroup', nonstick: false });
	});

	it('should handle @group with extra whitespace', () => {
		const code = ['module test', ';   @group   spaceGroup', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'spaceGroup', nonstick: false });
	});

	it('should handle @group with leading whitespace', () => {
		const code = ['module test', '  ; @group leadGroup', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'leadGroup', nonstick: false });
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
		expect(parseGroup(code)).toEqual({ groupName: 'firstGroup', nonstick: false });
	});

	it('should not match @groupOther (strict word boundary)', () => {
		const code = ['module test', '; @groupOther notGroup', 'moduleEnd'];
		expect(parseGroup(code)).toBe(undefined);
	});

	it('should extract only the first token as group name', () => {
		const code = ['module test', '; @group myGroup extra text here', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', nonstick: false });
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
			nonstick: false,
		});
		expect(parseGroup(['module commentGroup', '; @group commentGroup', 'moduleEnd'])).toEqual({
			groupName: 'commentGroup',
			nonstick: false,
		});
		expect(parseGroup(['vertexShader postprocess', '; @group shaderGroup', 'vertexShaderEnd'])).toEqual({
			groupName: 'shaderGroup',
			nonstick: false,
		});
	});

	it('should handle group names with hyphens', () => {
		const code = ['module test', '; @group audio-chain-1', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'audio-chain-1', nonstick: false });
	});

	it('should handle group names with underscores', () => {
		const code = ['module test', '; @group audio_chain_1', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'audio_chain_1', nonstick: false });
	});

	it('should handle alphanumeric group names', () => {
		const code = ['module test', '; @group group123', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'group123', nonstick: false });
	});

	// New tests for nonstick functionality
	it('should parse nonstick flag when present', () => {
		const code = ['module test', '; @group myGroup nonstick', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', nonstick: true });
	});

	it('should parse nonstick flag with extra whitespace', () => {
		const code = ['module test', '; @group myGroup   nonstick', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', nonstick: true });
	});

	it('should ignore third token after nonstick', () => {
		const code = ['module test', '; @group myGroup nonstick extra', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', nonstick: true });
	});

	it('should not set nonstick for non-nonstick second argument', () => {
		const code = ['module test', '; @group myGroup lock', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', nonstick: false });
	});

	it('should not set nonstick for invalid second argument', () => {
		const code = ['module test', '; @group myGroup other', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', nonstick: false });
	});

	it('should be case sensitive for nonstick keyword', () => {
		const code = ['module test', '; @group myGroup Nonstick', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', nonstick: false });
	});

	it('should be case sensitive for nonstick keyword uppercase', () => {
		const code = ['module test', '; @group myGroup NONSTICK', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', nonstick: false });
	});

	// Tests to ensure sticky keyword is no longer recognized
	it('should not recognize sticky keyword', () => {
		const code = ['module test', '; @group myGroup sticky', 'moduleEnd'];
		expect(parseGroup(code)).toEqual({ groupName: 'myGroup', nonstick: false });
	});
});
