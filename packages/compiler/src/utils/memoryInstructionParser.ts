import { resolveConstantValueOrExpressionOrThrow, tryResolveConstantValueOrExpression } from './resolveConstantValue';

import { parseMemoryInstructionArgumentsShape, type SplitByteToken } from '../syntax/memoryInstructionParser';
import { SyntaxRulesError, SyntaxErrorCode } from '../syntax/syntaxError';
import { ArgumentType } from '../syntax/parseArgument';
import { ErrorCode, getError } from '../compilerError';
import hasMemoryReferencePrefixStart from '../syntax/hasMemoryReferencePrefixStart';
import isConstantName from '../syntax/isConstantName';

import type { CompilationContext, Argument } from '../types';

/**
 * Returns the maximum number of bytes allowed for a split-byte default value.
 * Split-byte is restricted to 4 bytes (32-bit) for all declaration types to avoid
 * exceeding JavaScript's Number.MAX_SAFE_INTEGER on 8-byte paths.
 */
function getMaxBytesForInstruction(): number {
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

/**
 * Resolves a split-byte token sequence into a single combined integer default value.
 * Literal tokens are used directly; identifier tokens are resolved as compile-time constants
 * and validated to be integers in the range 0–255.
 *
 * If an identifier token does not resolve to a declared constant, throws
 * CONSTANT_NAME_AS_MEMORY_IDENTIFIER — constant-style names in split-byte position must be
 * declared constants (they cannot be memory names).
 */
function resolveSplitByteTokens(
	tokens: SplitByteToken[],
	maxBytes: number,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	lineForError: any,
	context: CompilationContext
): number {
	if (tokens.length > maxBytes) {
		throw getError(ErrorCode.SPLIT_HEX_TOO_MANY_BYTES, lineForError, context);
	}
	const bytes: number[] = [];
	for (const token of tokens) {
		if (token.type === 'literal') {
			// Already validated as byte literal (0–255) at the syntax level
			bytes.push(token.value);
		} else {
			// Identifier token must resolve to a declared compile-time constant.
			// Use tryResolve so we can provide a clearer error than UNDECLARED_IDENTIFIER when the
			// constant-style name was never declared (user likely intended it as a memory name).
			const constant = tryResolveConstantValueOrExpression(context.namespace.consts, token.value);
			if (!constant) {
				throw getError(ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER, lineForError, context);
			}
			if (!constant.isInteger || constant.value < 0 || constant.value > 255) {
				throw getError(ErrorCode.SPLIT_BYTE_CONSTANT_OUT_OF_RANGE, lineForError, context);
			}
			bytes.push(constant.value);
		}
	}
	return combineSplitHexBytes(bytes, maxBytes);
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

	const maxBytes = getMaxBytesForInstruction();
	let defaultValue = 0;
	let id = '';

	// Process first argument
	if (parsedArgs.firstArg.type === 'literal') {
		defaultValue = parsedArgs.firstArg.value;
		id = '__anonymous__' + lineNumber;
	} else if (parsedArgs.firstArg.type === 'split-byte-tokens') {
		defaultValue = resolveSplitByteTokens(parsedArgs.firstArg.tokens, maxBytes, lineForError, context);
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

	// Reject constant-style names as memory allocation identifiers
	if (isConstantName(id)) {
		throw getError(ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER, lineForError, context);
	}

	// Process second argument if present
	if (parsedArgs.secondArg) {
		if (parsedArgs.secondArg.type === 'literal') {
			defaultValue = parsedArgs.secondArg.value;
		} else if (parsedArgs.secondArg.type === 'split-byte-tokens') {
			defaultValue = resolveSplitByteTokens(parsedArgs.secondArg.tokens, maxBytes, lineForError, context);
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
					HI: { value: 32, isInteger: true },
					LO: { value: 64, isInteger: true },
					BIG: { value: 300, isInteger: true },
					FRAC: { value: 0.5, isInteger: false },
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

		it('resolves named constant split-byte sequence (HI LO) into combined default', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'HI' },
				{ type: ArgumentType.IDENTIFIER, value: 'LO' },
			];
			const result = parseMemoryInstructionArguments(args, 100, 'int', mockContext);
			expect(result.id).toBe('myVar');
			// HI=32=0x20, LO=64=0x40 → [0x20, 0x40, 0x00, 0x00] = 0x20400000
			expect(result.defaultValue).toBe(0x20400000);
		});

		it('resolves anonymous constant split-byte sequence (HI LO) into combined default', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'HI' },
				{ type: ArgumentType.IDENTIFIER, value: 'LO' },
			];
			const result = parseMemoryInstructionArguments(args, 110, 'int', mockContext);
			expect(result.id).toBe('__anonymous__110');
			expect(result.defaultValue).toBe(0x20400000);
		});

		it('resolves mixed byte literal and constant in named split-byte', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.IDENTIFIER, value: 'LO' },
			];
			const result = parseMemoryInstructionArguments(args, 120, 'int', mockContext);
			expect(result.id).toBe('myVar');
			// 0xA8=168, LO=64=0x40 → [168, 64, 0, 0] = 0xA8400000
			expect(result.defaultValue).toBe(0xa8400000);
		});

		it('throws when constant in split-byte sequence is out of byte range (> 255)', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'HI' },
				{ type: ArgumentType.IDENTIFIER, value: 'BIG' },
			];
			expect(() => parseMemoryInstructionArguments(args, 130, 'int', mockContext)).toThrow();
		});

		it('throws when constant in split-byte sequence is a non-integer (float)', () => {
			const args: Argument[] = [
				{ type: ArgumentType.IDENTIFIER, value: 'myVar' },
				{ type: ArgumentType.IDENTIFIER, value: 'HI' },
				{ type: ArgumentType.IDENTIFIER, value: 'FRAC' },
			];
			expect(() => parseMemoryInstructionArguments(args, 140, 'int', mockContext)).toThrow();
		});

		it('throws when constant-style name is used as memory identifier', () => {
			const args: Argument[] = [{ type: ArgumentType.IDENTIFIER, value: 'MY_VAR' }];
			expect(() => parseMemoryInstructionArguments(args, 150, 'int', mockContext)).toThrow();
		});
	});
}
