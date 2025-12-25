import { describe, it, expect } from 'vitest';

import { instructionParser, isComment, isValidInstruction } from '../src/instructionParser';

describe('instructionParser', () => {
	it('parses a simple instruction with one argument', () => {
		const match = 'push 42'.match(instructionParser);
		expect(match?.[1]).toBe('push');
		expect(match?.[2]).toBe('42');
	});

	it('parses an instruction with multiple arguments', () => {
		const match = 'function add int int'.match(instructionParser);
		expect(match?.[1]).toBe('function');
		expect(match?.[2]).toBe('add');
		expect(match?.[3]).toBe('int');
		expect(match?.[4]).toBe('int');
	});

	it('ignores comments at the end of the line', () => {
		const match = 'push 42 ; this is a comment'.match(instructionParser);
		expect(match?.[1]).toBe('push');
		expect(match?.[2]).toBe('42');
	});

	it('handles leading whitespace', () => {
		const match = '  push 42'.match(instructionParser);
		expect(match?.[1]).toBe('push');
		expect(match?.[2]).toBe('42');
	});
});

describe('isComment', () => {
	it('returns true for a line starting with semicolon', () => {
		expect(isComment('; this is a comment')).toBe(true);
	});

	it('returns true for a line with leading whitespace and semicolon', () => {
		expect(isComment('  ; this is a comment')).toBe(true);
	});

	it('returns false for a regular instruction', () => {
		expect(isComment('push 42')).toBe(false);
	});

	it('returns false for an instruction with a trailing comment', () => {
		expect(isComment('push 42 ; comment')).toBe(false);
	});
});

describe('isValidInstruction', () => {
	it('returns true for a valid instruction', () => {
		expect(isValidInstruction('push 42')).toBe(true);
	});

	it('returns true for a valid instruction with multiple arguments', () => {
		expect(isValidInstruction('function add int int')).toBe(true);
	});

	it('returns true for an instruction with trailing comment', () => {
		expect(isValidInstruction('push 42 ; comment')).toBe(true);
	});

	it('returns false for an empty line', () => {
		expect(isValidInstruction('')).toBe(false);
	});

	it('returns false for whitespace-only line', () => {
		expect(isValidInstruction('   ')).toBe(false);
	});
});
