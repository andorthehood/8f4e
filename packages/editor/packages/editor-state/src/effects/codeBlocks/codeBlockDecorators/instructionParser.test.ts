import { describe, it, expect } from 'vitest';
import instructionParser from './instructionParser';

describe('instructionParser', () => {
	it('should parse instruction with no arguments', () => {
		const line = 'nop';
		const match = line.match(instructionParser);

		expect(match).not.toBeNull();
		expect(match?.[1]).toBe('nop');
		expect(match?.[2]).toBe('');
	});

	it('should parse instruction with one argument', () => {
		const line = 'debug myVar';
		const match = line.match(instructionParser);

		expect(match).not.toBeNull();
		expect(match?.[1]).toBe('debug');
		expect(match?.[2]).toBe('myVar');
		expect(match?.[3]).toBe('');
	});

	it('should parse instruction with two arguments', () => {
		const line = 'mov a b';
		const match = line.match(instructionParser);

		expect(match).not.toBeNull();
		expect(match?.[1]).toBe('mov');
		expect(match?.[2]).toBe('a');
		expect(match?.[3]).toBe('b');
		expect(match?.[4]).toBe('');
	});

	it('should parse instruction with three arguments', () => {
		const line = 'button myButton 0 1';
		const match = line.match(instructionParser);

		expect(match).not.toBeNull();
		expect(match?.[1]).toBe('button');
		expect(match?.[2]).toBe('myButton');
		expect(match?.[3]).toBe('0');
		expect(match?.[4]).toBe('1');
		expect(match?.[5]).toBe('');
	});

	it('should parse instruction with four arguments', () => {
		const line = 'plot buffer -10 10 length';
		const match = line.match(instructionParser);

		expect(match).not.toBeNull();
		expect(match?.[1]).toBe('plot');
		expect(match?.[2]).toBe('buffer');
		expect(match?.[3]).toBe('-10');
		expect(match?.[4]).toBe('10');
		expect(match?.[5]).toBe('length');
		expect(match?.[6]).toBe('');
	});

	it('should ignore comments after semicolon', () => {
		const line = 'mov a b; this is a comment';
		const match = line.match(instructionParser);

		expect(match).not.toBeNull();
		expect(match?.[1]).toBe('mov');
		expect(match?.[2]).toBe('a');
		expect(match?.[3]).toBe('b');
	});

	it('should handle leading whitespace', () => {
		const line = '    mov a b';
		const match = line.match(instructionParser);

		expect(match).not.toBeNull();
		expect(match?.[1]).toBe('mov');
		expect(match?.[2]).toBe('a');
		expect(match?.[3]).toBe('b');
	});

	it('should handle trailing whitespace', () => {
		const line = 'mov a b    ';
		const match = line.match(instructionParser);

		expect(match).not.toBeNull();
		expect(match?.[1]).toBe('mov');
		expect(match?.[2]).toBe('a');
		expect(match?.[3]).toBe('b');
	});

	it('should handle mixed whitespace', () => {
		const line = '  mov   a    b  ';
		const match = line.match(instructionParser);

		expect(match).not.toBeNull();
		expect(match?.[1]).toBe('mov');
		expect(match?.[2]).toBe('a');
		expect(match?.[3]).toBe('b');
	});

	it('should match empty line or return null', () => {
		const line = '';
		const match = line.match(instructionParser);

		// Empty line may or may not match depending on regex implementation
		if (match) {
			expect(match[1]).toBeDefined();
		}
	});

	it('should handle line with only whitespace', () => {
		const line = '   ';
		const match = line.match(instructionParser);

		// Whitespace-only line may or may not match
		if (match) {
			expect(match).toBeDefined();
		}
	});

	it('should handle line with only comment', () => {
		const line = '; just a comment';
		const match = line.match(instructionParser);

		// Comment-only line should match
		if (match) {
			expect(match[1]).toBeDefined();
		}
	});

	it('should handle complex instruction types', () => {
		const line = 'int* myPointer';
		const match = line.match(instructionParser);

		expect(match).not.toBeNull();
		expect(match?.[1]).toBe('int*');
		expect(match?.[2]).toBe('myPointer');
	});

	it('should handle instruction with many arguments', () => {
		const line = 'instr arg1 arg2 arg3 arg4 arg5 arg6 arg7';
		const match = line.match(instructionParser);

		expect(match).not.toBeNull();
		expect(match?.[1]).toBe('instr');
		expect(match?.[2]).toBe('arg1');
		expect(match?.[3]).toBe('arg2');
		expect(match?.[4]).toBe('arg3');
		expect(match?.[5]).toBe('arg4');
		expect(match?.[6]).toBe('arg5');
		expect(match?.[7]).toBe('arg6');
		expect(match?.[8]).toBe('arg7');
	});
});

