import { parseMemoryInstructionArgumentsShape, type SplitByteToken } from '@8f4e/tokenizer';
import { ArgumentType } from '@8f4e/tokenizer';

import resolveIntermodularReferenceValue from './resolveIntermodularReferenceValue';

import { ErrorCode, getError } from '../compilerError';

import type { AST, CompilationContext, Argument } from '../types';
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
			// Split-byte identifiers must be declared constants. General compile-time folding happens
			// earlier during AST normalization, so only plain constant identifiers remain here.
			const constant = context.namespace.consts[token.value];
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
	line: AST[number],
	context: CompilationContext
): { id: string; defaultValue: number } {
	const { arguments: args, lineNumberAfterMacroExpansion } = line;
	const lineForError = line;
	// TODO: semantic normalization now guarantees unresolved COMPILE_TIME_EXPRESSION nodes
	// should not reach memory parsing. Once the normalized AST contract is tightened, this
	// parser can rely on a narrower argument shape instead of broad AST[number] input.

	const parsedArgs = parseMemoryInstructionArgumentsShape(args);

	const maxBytes = getMaxBytesForInstruction();
	let defaultValue = 0;
	let id = '';

	// Process first argument
	if (parsedArgs.firstArg.type === 'literal') {
		defaultValue = parsedArgs.firstArg.value;
		id = '__anonymous__' + lineNumberAfterMacroExpansion;
	} else if (parsedArgs.firstArg.type === 'split-byte-tokens') {
		defaultValue = resolveSplitByteTokens(parsedArgs.firstArg.tokens, maxBytes, lineForError, context);
		id = '__anonymous__' + lineNumberAfterMacroExpansion;
	} else if (parsedArgs.firstArg.type === 'identifier') {
		id = parsedArgs.firstArg.value;
	}

	// Reject constant-style names as memory allocation identifiers (only when used as a plain identifier, not split-byte tokens)
	if (parsedArgs.firstArg.type === 'identifier') {
		const firstArgIdentifier = line.arguments[0]?.type === ArgumentType.IDENTIFIER ? line.arguments[0] : null;
		if (firstArgIdentifier?.referenceKind === 'constant') {
			throw getError(ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER, lineForError, context);
		}
	}

	// Process second argument if present
	if (parsedArgs.secondArg) {
		const secondArgIdentifier = line.arguments[1]?.type === ArgumentType.IDENTIFIER ? line.arguments[1] : undefined;

		if (parsedArgs.secondArg.type === 'literal') {
			defaultValue = parsedArgs.secondArg.value;
		} else if (parsedArgs.secondArg.type === 'split-byte-tokens') {
			defaultValue = resolveSplitByteTokens(parsedArgs.secondArg.tokens, maxBytes, lineForError, context);
		} else if (parsedArgs.secondArg.type === 'intermodular-reference') {
			defaultValue = secondArgIdentifier
				? (resolveIntermodularReferenceValue(secondArgIdentifier, lineForError, context) ?? 0)
				: 0;
		} else if (parsedArgs.secondArg.type === 'intermodular-module-reference') {
			defaultValue = secondArgIdentifier
				? (resolveIntermodularReferenceValue(secondArgIdentifier, lineForError, context) ?? 0)
				: 0;
		} else if (parsedArgs.secondArg.type === 'intermodular-element-count') {
			defaultValue = secondArgIdentifier
				? (resolveIntermodularReferenceValue(secondArgIdentifier, lineForError, context) ?? 0)
				: 0;
		} else if (parsedArgs.secondArg.type === 'intermodular-element-word-size') {
			defaultValue = secondArgIdentifier
				? (resolveIntermodularReferenceValue(secondArgIdentifier, lineForError, context) ?? 0)
				: 0;
		} else if (parsedArgs.secondArg.type === 'intermodular-element-max') {
			defaultValue = secondArgIdentifier
				? (resolveIntermodularReferenceValue(secondArgIdentifier, lineForError, context) ?? 0)
				: 0;
		} else if (parsedArgs.secondArg.type === 'intermodular-element-min') {
			defaultValue = secondArgIdentifier
				? (resolveIntermodularReferenceValue(secondArgIdentifier, lineForError, context) ?? 0)
				: 0;
		} else if (parsedArgs.secondArg.type === 'memory-reference') {
			const memoryItem = context.namespace.memory[parsedArgs.secondArg.base];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, {
					identifier: parsedArgs.secondArg.base,
				});
			}

			// Use start or end address based on syntax: &buffer (isEndAddress false) vs buffer& (isEndAddress true)
			if (!secondArgIdentifier?.isEndAddress) {
				defaultValue = memoryItem.byteAddress;
			} else {
				// Compute end address directly from memoryItem
				defaultValue = memoryItem.byteAddress + (memoryItem.wordAlignedSize - 1) * 4;
			}
		} else if (parsedArgs.secondArg.type === 'element-count') {
			const memoryItem = context.namespace.memory[parsedArgs.secondArg.base];

			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, {
					identifier: parsedArgs.secondArg.base,
				});
			}

			defaultValue = memoryItem.wordAlignedSize;
		} else if (parsedArgs.secondArg.type === 'identifier') {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, {
				identifier: parsedArgs.secondArg.value,
			});
		}
	}

	return { id, defaultValue };
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

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
			const result = parseMemoryInstructionArguments(
				{
					lineNumberBeforeMacroExpansion: 10,
					lineNumberAfterMacroExpansion: 10,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			);
			expect(result.id).toBe('__anonymous__10');
			expect(result.defaultValue).toBe(123);
		});

		it('parses identifier argument', () => {
			const args: Argument[] = [classifyIdentifier('myId')];
			const result = parseMemoryInstructionArguments(
				{
					lineNumberBeforeMacroExpansion: 20,
					lineNumberAfterMacroExpansion: 20,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			);
			expect(result.id).toBe('myId');
			expect(result.defaultValue).toBe(0);
		});

		it('rejects unnormalized constant-style identifiers as memory names', () => {
			const args: Argument[] = [classifyIdentifier('MY_CONST')];
			expect(() =>
				parseMemoryInstructionArguments(
					{
						lineNumberBeforeMacroExpansion: 30,
						lineNumberAfterMacroExpansion: 30,
						instruction: 'int',
						arguments: args,
					},
					mockContext
				)
			).toThrow();
		});

		it('parses identifier with literal default value', () => {
			const args: Argument[] = [
				classifyIdentifier('myVar'),
				{ type: ArgumentType.LITERAL, value: 99, isInteger: true },
			];
			const result = parseMemoryInstructionArguments(
				{
					lineNumberBeforeMacroExpansion: 40,
					lineNumberAfterMacroExpansion: 40,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			);
			expect(result.id).toBe('myVar');
			expect(result.defaultValue).toBe(99);
		});

		it('rejects unnormalized identifier defaults that were not folded earlier', () => {
			const args: Argument[] = [classifyIdentifier('myVar'), classifyIdentifier('myConst')];
			expect(() =>
				parseMemoryInstructionArguments(
					{
						lineNumberBeforeMacroExpansion: 50,
						lineNumberAfterMacroExpansion: 50,
						instruction: 'int',
						arguments: args,
					},
					mockContext
				)
			).toThrow();
		});

		it('combines named split hex bytes into one integer default (2 bytes, right-padded)', () => {
			const args: Argument[] = [
				classifyIdentifier('myVar'),
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
			];
			const result = parseMemoryInstructionArguments(
				{
					lineNumberBeforeMacroExpansion: 60,
					lineNumberAfterMacroExpansion: 60,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			);
			expect(result.id).toBe('myVar');
			expect(result.defaultValue).toBe(0xa8ff0000);
		});

		it('combines named split hex bytes into one integer default (4 bytes)', () => {
			const args: Argument[] = [
				classifyIdentifier('myVar'),
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
			];
			const result = parseMemoryInstructionArguments(
				{
					lineNumberBeforeMacroExpansion: 70,
					lineNumberAfterMacroExpansion: 70,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			);
			expect(result.id).toBe('myVar');
			expect(result.defaultValue).toBe(0xa8ff0000);
		});

		it('combines anonymous split hex bytes into one integer default', () => {
			const args: Argument[] = [
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
			];
			const result = parseMemoryInstructionArguments(
				{
					lineNumberBeforeMacroExpansion: 80,
					lineNumberAfterMacroExpansion: 80,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			);
			expect(result.id).toBe('__anonymous__80');
			expect(result.defaultValue).toBe(0xa8ff0000);
		});

		it('throws SPLIT_HEX_TOO_MANY_BYTES when byte count exceeds type width', () => {
			const args: Argument[] = [
				classifyIdentifier('myVar'),
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0xff, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x00, isInteger: true, isHex: true },
				{ type: ArgumentType.LITERAL, value: 0x01, isInteger: true, isHex: true },
			];
			expect(() =>
				parseMemoryInstructionArguments(
					{
						lineNumberBeforeMacroExpansion: 90,
						lineNumberAfterMacroExpansion: 90,
						instruction: 'int',
						arguments: args,
					},
					mockContext
				)
			).toThrow();
		});

		it('resolves named constant split-byte sequence (HI LO) into combined default', () => {
			const args: Argument[] = [classifyIdentifier('myVar'), classifyIdentifier('HI'), classifyIdentifier('LO')];
			const result = parseMemoryInstructionArguments(
				{
					lineNumberBeforeMacroExpansion: 100,
					lineNumberAfterMacroExpansion: 100,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			);
			expect(result.id).toBe('myVar');
			// HI=32=0x20, LO=64=0x40 → [0x20, 0x40, 0x00, 0x00] = 0x20400000
			expect(result.defaultValue).toBe(0x20400000);
		});

		it('resolves anonymous constant split-byte sequence (HI LO) into combined default', () => {
			const args: Argument[] = [classifyIdentifier('HI'), classifyIdentifier('LO')];
			const result = parseMemoryInstructionArguments(
				{
					lineNumberBeforeMacroExpansion: 110,
					lineNumberAfterMacroExpansion: 110,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			);
			expect(result.id).toBe('__anonymous__110');
			expect(result.defaultValue).toBe(0x20400000);
		});

		it('resolves mixed byte literal and constant in named split-byte', () => {
			const args: Argument[] = [
				classifyIdentifier('myVar'),
				{ type: ArgumentType.LITERAL, value: 0xa8, isInteger: true, isHex: true },
				classifyIdentifier('LO'),
			];
			const result = parseMemoryInstructionArguments(
				{
					lineNumberBeforeMacroExpansion: 120,
					lineNumberAfterMacroExpansion: 120,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			);
			expect(result.id).toBe('myVar');
			// 0xA8=168, LO=64=0x40 → [168, 64, 0, 0] = 0xA8400000
			expect(result.defaultValue).toBe(0xa8400000);
		});

		it('throws when constant in split-byte sequence is out of byte range (> 255)', () => {
			const args: Argument[] = [classifyIdentifier('myVar'), classifyIdentifier('HI'), classifyIdentifier('BIG')];
			expect(() =>
				parseMemoryInstructionArguments(
					{
						lineNumberBeforeMacroExpansion: 130,
						lineNumberAfterMacroExpansion: 130,
						instruction: 'int',
						arguments: args,
					},
					mockContext
				)
			).toThrow();
		});

		it('throws when constant in split-byte sequence is a non-integer (float)', () => {
			const args: Argument[] = [classifyIdentifier('myVar'), classifyIdentifier('HI'), classifyIdentifier('FRAC')];
			expect(() =>
				parseMemoryInstructionArguments(
					{
						lineNumberBeforeMacroExpansion: 140,
						lineNumberAfterMacroExpansion: 140,
						instruction: 'int',
						arguments: args,
					},
					mockContext
				)
			).toThrow();
		});

		it('throws when constant-style name is used as memory identifier', () => {
			const args: Argument[] = [classifyIdentifier('MY_VAR')];
			expect(() =>
				parseMemoryInstructionArguments(
					{
						lineNumberBeforeMacroExpansion: 150,
						lineNumberAfterMacroExpansion: 150,
						instruction: 'int',
						arguments: args,
					},
					mockContext
				)
			).toThrow();
		});
	});
}
