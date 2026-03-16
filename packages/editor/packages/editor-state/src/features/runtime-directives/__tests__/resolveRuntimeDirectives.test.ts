import { describe, it, expect } from 'vitest';

import { parseRuntimeDirective } from '../parseRuntimeDirective';
import { resolveRuntimeDirectives } from '../resolveRuntimeDirectives';

describe('parseRuntimeDirective', () => {
	it('should parse a valid ~sampleRate line', () => {
		expect(parseRuntimeDirective('; ~sampleRate 44100')).toEqual({ name: 'sampleRate', args: ['44100'] });
	});

	it('should parse with leading whitespace', () => {
		expect(parseRuntimeDirective('  ; ~sampleRate 44100')).toEqual({ name: 'sampleRate', args: ['44100'] });
	});

	it('should parse a directive with no args', () => {
		expect(parseRuntimeDirective('; ~sampleRate')).toEqual({ name: 'sampleRate', args: [] });
	});

	it('should return undefined for editor directives (@ prefix)', () => {
		expect(parseRuntimeDirective('; @pos 0 0')).toBeUndefined();
	});

	it('should return undefined for plain comments', () => {
		expect(parseRuntimeDirective('; just a comment')).toBeUndefined();
	});

	it('should return undefined for non-comment lines', () => {
		expect(parseRuntimeDirective('push 44100')).toBeUndefined();
	});

	it('should return undefined for empty lines', () => {
		expect(parseRuntimeDirective('')).toBeUndefined();
	});

	it('should parse unknown directive names', () => {
		expect(parseRuntimeDirective('; ~runtime WebWorker')).toEqual({ name: 'runtime', args: ['WebWorker'] });
	});
});

describe('resolveRuntimeDirectives', () => {
	it('should return empty resolved when no directives are present', () => {
		const result = resolveRuntimeDirectives([{ code: ['module test', 'push 1', 'moduleEnd'] }]);
		expect(result.resolved).toEqual({});
		expect(result.errors).toEqual([]);
	});

	it('should resolve ~sampleRate from a module block', () => {
		const result = resolveRuntimeDirectives([
			{
				code: ['module test', '; ~sampleRate 44100', 'push 1', 'moduleEnd'],
			},
		]);
		expect(result.resolved.sampleRate).toBe(44100);
		expect(result.errors).toEqual([]);
	});

	it('should resolve ~sampleRate from a constants block', () => {
		const result = resolveRuntimeDirectives([
			{
				code: ['constants env', '; ~sampleRate 48000', 'constantsEnd'],
			},
		]);
		expect(result.resolved.sampleRate).toBe(48000);
		expect(result.errors).toEqual([]);
	});

	it('should resolve ~sampleRate from a config block', () => {
		const result = resolveRuntimeDirectives([
			{
				code: ['config project', '; ~sampleRate 22050', 'configEnd'],
			},
		]);
		expect(result.resolved.sampleRate).toBe(22050);
		expect(result.errors).toEqual([]);
	});

	it('should resolve ~sampleRate from a function block', () => {
		const result = resolveRuntimeDirectives([
			{
				code: ['function helper', '; ~sampleRate 44100', 'functionEnd'],
			},
		]);
		expect(result.resolved.sampleRate).toBe(44100);
		expect(result.errors).toEqual([]);
	});

	it('should allow duplicate identical ~sampleRate values across blocks', () => {
		const result = resolveRuntimeDirectives([
			{ code: ['module a', '; ~sampleRate 44100', 'moduleEnd'] },
			{ code: ['module b', '; ~sampleRate 44100', 'moduleEnd'] },
		]);
		expect(result.resolved.sampleRate).toBe(44100);
		expect(result.errors).toEqual([]);
	});

	it('should produce an error for conflicting ~sampleRate values', () => {
		const result = resolveRuntimeDirectives([
			{ code: ['module a', '; ~sampleRate 44100', 'moduleEnd'] },
			{ code: ['module b', '; ~sampleRate 48000', 'moduleEnd'] },
		]);
		expect(result.resolved.sampleRate).toBe(44100);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('conflicting values');
		expect(result.errors[0].message).toContain('44100');
		expect(result.errors[0].message).toContain('48000');
	});

	it('should produce an error for ~sampleRate with no argument', () => {
		const result = resolveRuntimeDirectives([{ code: ['module a', '; ~sampleRate', 'moduleEnd'] }]);
		expect(result.resolved).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('requires a numeric argument');
	});

	it('should produce an error for non-numeric ~sampleRate argument', () => {
		const result = resolveRuntimeDirectives([{ code: ['module a', '; ~sampleRate abc', 'moduleEnd'] }]);
		expect(result.resolved).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('invalid value');
	});

	it('should produce an error for zero ~sampleRate', () => {
		const result = resolveRuntimeDirectives([{ code: ['module a', '; ~sampleRate 0', 'moduleEnd'] }]);
		expect(result.resolved).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('invalid value');
	});

	it('should produce an error for negative ~sampleRate', () => {
		const result = resolveRuntimeDirectives([{ code: ['module a', '; ~sampleRate -44100', 'moduleEnd'] }]);
		expect(result.resolved).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('invalid value');
	});

	it('should report error at the correct line number and block index (no id)', () => {
		const result = resolveRuntimeDirectives([{ code: ['module a', 'push 1', '; ~sampleRate -1', 'moduleEnd'] }]);
		expect(result.errors[0].lineNumber).toBe(2);
		expect(result.errors[0].codeBlockId).toBe(0);
	});

	it('should use block id as codeBlockId when id is provided', () => {
		const result = resolveRuntimeDirectives([{ code: ['module a', '; ~sampleRate -1', 'moduleEnd'], id: 'module_a' }]);
		expect(result.errors[0].codeBlockId).toBe('module_a');
	});

	it('should resolve ~sampleRate from any block type in project order', () => {
		const result = resolveRuntimeDirectives([
			{ code: ['config project', 'configEnd'] },
			{ code: ['module a', '; ~sampleRate 44100', 'moduleEnd'] },
			{ code: ['constants env', 'constantsEnd'] },
		]);
		expect(result.resolved.sampleRate).toBe(44100);
		expect(result.errors).toEqual([]);
	});
});
