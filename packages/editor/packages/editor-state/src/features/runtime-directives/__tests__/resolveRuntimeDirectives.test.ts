import { describe, it, expect } from 'vitest';

import { parseBlockDirectives } from '../../code-blocks/utils/parseBlockDirectives';
import { resolveRuntimeDirectives } from '../resolveRuntimeDirectives';

function createParsedBlock(code: string[], id?: string) {
	return {
		id,
		parsedDirectives: parseBlockDirectives(code),
	};
}

describe('resolveRuntimeDirectives', () => {
	it('should return empty resolved when no directives are present', () => {
		const result = resolveRuntimeDirectives([createParsedBlock(['module test', 'push 1', 'moduleEnd'])]);
		expect(result.resolved).toEqual({});
		expect(result.errors).toEqual([]);
	});

	it('should resolve ~sampleRate from a module block', () => {
		const result = resolveRuntimeDirectives([
			createParsedBlock(['module test', '; ~sampleRate 44100', 'push 1', 'moduleEnd']),
		]);
		expect(result.resolved.sampleRate).toBe(44100);
		expect(result.errors).toEqual([]);
	});

	it('should resolve ~sampleRate from a constants block', () => {
		const result = resolveRuntimeDirectives([
			createParsedBlock(['constants env', '; ~sampleRate 48000', 'constantsEnd']),
		]);
		expect(result.resolved.sampleRate).toBe(48000);
		expect(result.errors).toEqual([]);
	});

	it('should resolve ~sampleRate from a config block', () => {
		const result = resolveRuntimeDirectives([
			createParsedBlock(['config project', '; ~sampleRate 22050', 'configEnd']),
		]);
		expect(result.resolved.sampleRate).toBe(22050);
		expect(result.errors).toEqual([]);
	});

	it('should resolve ~sampleRate from a function block', () => {
		const result = resolveRuntimeDirectives([
			createParsedBlock(['function helper', '; ~sampleRate 44100', 'functionEnd']),
		]);
		expect(result.resolved.sampleRate).toBe(44100);
		expect(result.errors).toEqual([]);
	});

	it('should allow duplicate identical ~sampleRate values across blocks', () => {
		const result = resolveRuntimeDirectives([
			createParsedBlock(['module a', '; ~sampleRate 44100', 'moduleEnd']),
			createParsedBlock(['module b', '; ~sampleRate 44100', 'moduleEnd']),
		]);
		expect(result.resolved.sampleRate).toBe(44100);
		expect(result.errors).toEqual([]);
	});

	it('should produce an error for conflicting ~sampleRate values', () => {
		const result = resolveRuntimeDirectives([
			createParsedBlock(['module a', '; ~sampleRate 44100', 'moduleEnd']),
			createParsedBlock(['module b', '; ~sampleRate 48000', 'moduleEnd']),
		]);
		expect(result.resolved.sampleRate).toBe(44100);
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('conflicting values');
		expect(result.errors[0].message).toContain('44100');
		expect(result.errors[0].message).toContain('48000');
	});

	it('should produce an error for ~sampleRate with no argument', () => {
		const result = resolveRuntimeDirectives([createParsedBlock(['module a', '; ~sampleRate', 'moduleEnd'])]);
		expect(result.resolved).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('requires a numeric argument');
	});

	it('should produce an error for non-numeric ~sampleRate argument', () => {
		const result = resolveRuntimeDirectives([createParsedBlock(['module a', '; ~sampleRate abc', 'moduleEnd'])]);
		expect(result.resolved).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('invalid value');
	});

	it('should produce an error for zero ~sampleRate', () => {
		const result = resolveRuntimeDirectives([createParsedBlock(['module a', '; ~sampleRate 0', 'moduleEnd'])]);
		expect(result.resolved).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('invalid value');
	});

	it('should produce an error for negative ~sampleRate', () => {
		const result = resolveRuntimeDirectives([createParsedBlock(['module a', '; ~sampleRate -44100', 'moduleEnd'])]);
		expect(result.resolved).toEqual({});
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0].message).toContain('invalid value');
	});

	it('should report error at the correct line number and block index (no id)', () => {
		const result = resolveRuntimeDirectives([
			createParsedBlock(['module a', 'push 1', '; ~sampleRate -1', 'moduleEnd']),
		]);
		expect(result.errors[0].lineNumber).toBe(2);
		expect(result.errors[0].codeBlockId).toBe(0);
	});

	it('should use block id as codeBlockId when id is provided', () => {
		const result = resolveRuntimeDirectives([
			createParsedBlock(['module a', '; ~sampleRate -1', 'moduleEnd'], 'module_a'),
		]);
		expect(result.errors[0].codeBlockId).toBe('module_a');
	});

	it('should resolve ~sampleRate from any block type in project order', () => {
		const result = resolveRuntimeDirectives([
			createParsedBlock(['config project', 'configEnd']),
			createParsedBlock(['module a', '; ~sampleRate 44100', 'moduleEnd']),
			createParsedBlock(['constants env', 'constantsEnd']),
		]);
		expect(result.resolved.sampleRate).toBe(44100);
		expect(result.errors).toEqual([]);
	});

	it('should resolve ~sampleRate from parsedDirectives when provided', () => {
		const result = resolveRuntimeDirectives([
			{
				id: 'module_a',
				parsedDirectives: [{ prefix: '~', name: 'sampleRate', args: ['44100'], rawRow: 1 }],
			},
		]);
		expect(result.resolved.sampleRate).toBe(44100);
		expect(result.errors).toEqual([]);
	});

	it('should report correct lineNumber from parsedDirectives rawRow', () => {
		const result = resolveRuntimeDirectives([
			{
				id: 'module_a',
				parsedDirectives: [{ prefix: '~', name: 'sampleRate', args: ['-1'], rawRow: 5 }],
			},
		]);
		expect(result.errors[0].lineNumber).toBe(5);
		expect(result.errors[0].codeBlockId).toBe('module_a');
	});

	it('should ignore editor directives (@) in parsedDirectives', () => {
		const result = resolveRuntimeDirectives([
			{
				parsedDirectives: [
					{ prefix: '@', name: 'pos', args: ['0', '0'], rawRow: 0 },
					{ prefix: '~', name: 'sampleRate', args: ['44100'], rawRow: 1 },
				],
			},
		]);
		expect(result.resolved.sampleRate).toBe(44100);
		expect(result.errors).toEqual([]);
	});
});
