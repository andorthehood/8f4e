import { ArgumentType, type SplitByteToken } from '@8f4e/tokenizer';

import resolveIntermodularReferenceValue from './resolveIntermodularReferenceValue';

import { ErrorCode, getError } from '../compilerError';

import type { AST, ArgumentIdentifier, ArgumentLiteral, CompilationContext, Argument } from '../types';

/**
 * Maximum number of bytes allowed in a split-byte default value.
 * Restricted to 4 bytes (32-bit) for all declaration types to avoid
 * exceeding JavaScript's Number.MAX_SAFE_INTEGER on 8-byte paths.
 */
const MAX_SPLIT_BYTE_WIDTH = 4;

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

function isByteLiteral(arg: Argument): arg is ArgumentLiteral & { isInteger: true } {
	return arg.type === ArgumentType.LITERAL && arg.isInteger === true && arg.value >= 0 && arg.value <= 255;
}

function toSplitByteToken(arg: Argument): SplitByteToken {
	if (arg.type === ArgumentType.LITERAL) return { type: 'literal', value: (arg as ArgumentLiteral).value };
	return { type: 'identifier', value: (arg as ArgumentIdentifier).value };
}

function collectSplitByteTokens(
	args: Argument[],
	start: number,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	lineForError: any,
	context: CompilationContext
): SplitByteToken[] {
	return args.slice(start).map(arg => {
		if (arg.type === ArgumentType.LITERAL && !isByteLiteral(arg)) {
			throw getError(ErrorCode.SPLIT_BYTE_CONSTANT_OUT_OF_RANGE, lineForError, context);
		}
		return toSplitByteToken(arg);
	});
}

/**
 * Resolves the second (default-value) argument of a memory declaration directly from the
 * pre-classified AST argument. Reads referenceKind, targetMemoryId, and isEndAddress fields
 * set by the tokenizer during parsing rather than re-parsing the raw string.
 */
function resolveDefaultArgValue(arg: Argument, lineForError: AST[number], context: CompilationContext): number {
	if (arg.type === ArgumentType.LITERAL) {
		return arg.value;
	}

	if (arg.type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, { identifier: '' });
	}

	switch (arg.referenceKind) {
		case 'intermodular-reference':
		case 'intermodular-module-reference':
		case 'intermodular-element-count':
		case 'intermodular-element-word-size':
		case 'intermodular-element-max':
		case 'intermodular-element-min':
			return resolveIntermodularReferenceValue(arg, lineForError, context) ?? 0;

		case 'memory-reference': {
			const memoryItem = context.namespace.memory[arg.targetMemoryId!];
			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, {
					identifier: arg.targetMemoryId!,
				});
			}
			return arg.isEndAddress ? memoryItem.byteAddress + (memoryItem.wordAlignedSize - 1) * 4 : memoryItem.byteAddress;
		}

		case 'element-count': {
			const memoryItem = context.namespace.memory[arg.targetMemoryId!];
			if (!memoryItem) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, {
					identifier: arg.targetMemoryId!,
				});
			}
			return memoryItem.wordAlignedSize;
		}

		default:
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, { identifier: arg.value });
	}
}

export default function parseMemoryInstructionArguments(
	line: AST[number],
	context: CompilationContext
): { id: string; defaultValue: number } {
	const { arguments: args, lineNumberAfterMacroExpansion } = line;
	const lineForError = line;
	let defaultValue = 0;
	let id = '';

	// Tokenizer validates arity, so args[0] is always present for memory instructions.
	const first = args[0];

	if (first.type === ArgumentType.LITERAL) {
		// Anonymous literal — may start a split-byte sequence.
		// An out-of-range first literal with extra args is rejected to prevent silent miscompilation.
		if (args.length > 1 && !isByteLiteral(first)) {
			throw getError(ErrorCode.SPLIT_BYTE_CONSTANT_OUT_OF_RANGE, lineForError, context);
		}
		id = '__anonymous__' + lineNumberAfterMacroExpansion;
		if (args.length > 1) {
			const tokens: SplitByteToken[] = [
				{ type: 'literal', value: (first as ArgumentLiteral).value },
				...collectSplitByteTokens(args, 1, lineForError, context),
			];
			defaultValue = resolveSplitByteTokens(tokens, MAX_SPLIT_BYTE_WIDTH, lineForError, context);
		} else {
			defaultValue = first.value;
		}
		return { id, defaultValue };
	}

	if (first.type !== ArgumentType.IDENTIFIER) {
		// COMPILE_TIME_EXPRESSION should not reach here; normalization folds them before memory parsing.
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, { identifier: '' });
	}

	if (first.referenceKind === 'constant') {
		// Constant-style names cannot be used as memory allocation identifiers.
		if (args.length > 1) {
			// Multiple args: anonymous split-byte sequence starting with a constant name
			id = '__anonymous__' + lineNumberAfterMacroExpansion;
			const tokens: SplitByteToken[] = [
				{ type: 'identifier', value: first.value },
				...collectSplitByteTokens(args, 1, lineForError, context),
			];
			defaultValue = resolveSplitByteTokens(tokens, MAX_SPLIT_BYTE_WIDTH, lineForError, context);
		} else {
			throw getError(ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER, lineForError, context);
		}
		return { id, defaultValue };
	}

	// Named declaration: plain identifier as allocation name
	id = first.value;

	if (args.length >= 3) {
		// Multiple default tokens: split-byte sequence
		defaultValue = resolveSplitByteTokens(
			collectSplitByteTokens(args, 1, lineForError, context),
			MAX_SPLIT_BYTE_WIDTH,
			lineForError,
			context
		);
	} else if (args.length === 2) {
		defaultValue = resolveDefaultArgValue(args[1], lineForError, context);
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
