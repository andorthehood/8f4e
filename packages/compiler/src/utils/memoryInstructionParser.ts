import { resolveConstantValueOrExpressionOrThrow, tryResolveConstantValueOrExpression } from './resolveConstantValue';

import { parseMemoryInstructionArgumentsShape } from '../syntax/memoryInstructionParser';
import { SyntaxRulesError, SyntaxErrorCode } from '../syntax/syntaxError';
import { ArgumentType } from '../syntax/parseArgument';
import { ErrorCode, getError } from '../errors';
import hasMemoryReferencePrefixStart from '../syntax/hasMemoryReferencePrefixStart';

import type { CompilationContext, Argument } from '../types';

/**
 * Returns the maximum number of bytes allowed for a split-hex default value
 * based on the declaration instruction (e.g. 'int' → 4, 'float64' → 8).
 */
function getMaxBytesForInstruction(instruction: string): number {
	if (instruction.startsWith('float64')) {
		return 8;
	}
	return 4;
}

/**
 * Combines an array of byte values (most-significant first) into a single integer,
 * right-padding with 0x00 bytes up to `maxBytes`.
 *
 * Example: combineSplitHexBytes([0xA8, 0xFF], 4) === 0xA8FF0000
 */
function combineSplitHexBytes(bytes: number[], maxBytes: number): number {
	let result = 0;
	for (let i = 0; i < bytes.length; i++) {
		result = result * 256 + bytes[i];
	}
	for (let i = bytes.length; i < maxBytes; i++) {
		result = result * 256;
	}
	return result;
}

export default function parseMemoryInstructionArguments(
	args: Array<Argument>,
	lineNumber: number,
	instruction: string,
	context: CompilationContext
): { id: string; defaultValue: number } {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const lineForError = { lineNumber, instruction, arguments: args } as any;

	// Use syntax parser for syntax-level validation and classification
	let parsedArgs;
	try {
		parsedArgs = parseMemoryInstructionArgumentsShape(args);
	} catch (error) {
		if (error instanceof SyntaxRulesError) {
			if (error.code === SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS) {
				throw getError(ErrorCode.SPLIT_HEX_MIXED_TOKENS, lineForError, context);
			}
			// Wrap syntax error as compiler error
			throw getError(ErrorCode.MISSING_ARGUMENT, lineForError, context);
		}
		throw error;
	}

	const maxBytes = getMaxBytesForInstruction(instruction);
	let defaultValue = 0;
	let id = '';

	// Process first argument
	if (parsedArgs.firstArg.type === 'literal') {
		defaultValue = parsedArgs.firstArg.value;
		id = '__anonymous__' + lineNumber;
	} else if (parsedArgs.firstArg.type === 'split-hex-literal') {
		if (parsedArgs.firstArg.bytes.length > maxBytes) {
			throw getError(ErrorCode.SPLIT_HEX_TOO_MANY_BYTES, lineForError, context);
		}
		defaultValue = combineSplitHexBytes(parsedArgs.firstArg.bytes, maxBytes);
		id = '__anonymous__' + lineNumber;
	} else if (parsedArgs.firstArg.type === 'identifier') {
		const constant = tryResolveConstantValueOrExpression(context.namespace.consts, parsedArgs.firstArg.value);

		if (constant) {
			defaultValue = constant.value;
			id = '__anonymous__' + lineNumber;
		} else {
			id = parsedArgs.firstArg.value;
		}
	}

	// Process second argument if present
	if (parsedArgs.secondArg) {
		if (parsedArgs.secondArg.type === 'literal') {
			defaultValue = parsedArgs.secondArg.value;
		} else if (parsedArgs.secondArg.type === 'split-hex-literal') {
			if (parsedArgs.secondArg.bytes.length > maxBytes) {
				throw getError(ErrorCode.SPLIT_HEX_TOO_MANY_BYTES, lineForError, context);
			}
			defaultValue = combineSplitHexBytes(parsedArgs.secondArg.bytes, maxBytes);
		} else if (parsedArgs.secondArg.type === 'intermodular-reference') {
			// Intermodular references are resolved later
		} else if (parsedArgs.secondArg.type === 'intermodular-element-count') {
			// Intermodular element count references are resolved later
		} else if (parsedArgs.secondArg.type === 'intermodular-element-word-size') {
			// Intermodular element word size references are resolved later
		} else if (parsedArgs.secondArg.type === 'intermodular-element-max') {
			// Intermodular element max references are resolved later
		} else if (parsedArgs.secondArg.type === 'intermodular-element-min') {
			// Intermodular element min references are resolved later
		} else if (parsedArgs.secondArg.type === 'memory-reference') {
			const memoryItem = context.namespace.memory[parsedArgs.secondArg.base];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context);
			}

			// Use start or end address based on syntax: &buffer vs buffer&
			if (hasMemoryReferencePrefixStart(parsedArgs.secondArg.pattern)) {
				defaultValue = memoryItem.byteAddress;
			} else {
				// Compute end address directly from memoryItem
				defaultValue = memoryItem.byteAddress + (memoryItem.wordAlignedSize - 1) * 4;
			}
		} else if (parsedArgs.secondArg.type === 'element-count') {
			const memoryItem = context.namespace.memory[parsedArgs.secondArg.base];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context);
			}

			defaultValue = memoryItem.wordAlignedSize;
		} else if (parsedArgs.secondArg.type === 'identifier') {
			const constant = resolveConstantValueOrExpressionOrThrow(parsedArgs.secondArg.value, lineForError, context);
			defaultValue = constant.value;
		}
	}

	return { id, defaultValue };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('parseMemoryInstructionArguments', () => {
		const mockContext = {
			namespace: {
				consts: {
					myConst: { value: 42, isInteger: true },
				},
				memory: {
					myVar: {
						byteAddress: 100,
						wordAlignedSize: 5,
					} as unknown as CompilationContext['namespace']['memory'][string],
				},
			},
		} as unknown as CompilationContext;

		it('parses literal argument as anonymous variable', () => {
			const args: Argument[] = [{ type: ArgumentType.LITERAL, value: 123, isInteger: true }];
			const result = parseMemoryInstructionArguments(args, 10, 'int', mockContext);
			expect(result.id).toBe('__anonymous__10');
			expect(result.defaultValue).toBe(123);
		});

		it('parses identifier argument', () => {
			const args: Argument[] = [{ type: ArgumentType.IDENTIFIER, value: 'myId' }];
			const result = parseMemoryInstructionArguments(args, 20, 'int', mockContext);
			expect(result.id).toBe('myId');
			expect(result.defaultValue).toBe(0);
		});

		it('parses constant as anonymous variable', () => {
			const args: Argument[] = [{ type: ArgumentType.IDENTIFIER, value: 'myConst' }];
			const result = parseMemoryInstructionArguments(args, 30, 'int', mockContext);
			expect(result.id).toBe('__anonymous__30');
			expect(result.defaultValue).toBe(42);
		});

		it('parses identifier with literal default value', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 99, isInteger: true },
			];
			const result = parseMemoryInstructionArguments(args, 40, 'int', mockContext);
			expect(result.id).toBe('myVar');
			expect(result.defaultValue).toBe(99);
		});

		it('parses identifier with constant default value', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'myConst' },
			];
			const result = parseMemoryInstructionArguments(args, 50, 'int', mockContext);
			expect(result.id).toBe('myVar');
			expect(result.defaultValue).toBe(42);
		});

		it('combines named split hex bytes into one integer default (2 bytes, right-padded)', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
			];
			const result = parseMemoryInstructionArguments(args, 60, 'int', mockContext);
			expect(result.id).toBe('myVar');
			expect(result.defaultValue).toBe(0xa8ff0000);
		});

		it('combines named split hex bytes into one integer default (4 bytes)', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
			];
			const result = parseMemoryInstructionArguments(args, 70, 'int', mockContext);
			expect(result.id).toBe('myVar');
			expect(result.defaultValue).toBe(0xa8ff0000);
		});

		it('combines anonymous split hex bytes into one integer default', () => {
			const args: Argument[] = [
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
			];
			const result = parseMemoryInstructionArguments(args, 80, 'int', mockContext);
			expect(result.id).toBe('__anonymous__80');
			expect(result.defaultValue).toBe(0xa8ff0000);
		});

		it('throws SPLIT_HEX_TOO_MANY_BYTES when byte count exceeds type width', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x01, isInteger: true, isHex: true },
			];
			expect(() => parseMemoryInstructionArguments(args, 90, 'int', mockContext)).toThrow();
		});

		it('throws SPLIT_HEX_MIXED_TOKENS when hex-byte is mixed with non-hex token', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 255, isInteger: true },
			];
			expect(() => parseMemoryInstructionArguments(args, 100, 'int', mockContext)).toThrow();
		});
	});
}
