import { ArgumentType, type SplitByteToken } from '@8f4e/tokenizer';

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
 * Looks up a memory item by id and throws UNDECLARED_IDENTIFIER if not found.
 * Centralizes the repeated pattern of memory map lookup followed by error on miss.
 */
function getMemoryItemOrThrow(
	memoryId: string,
	lineForError: AST[number],
	context: CompilationContext
): CompilationContext['namespace']['memory'][string] {
	const memoryItem = context.namespace.memory[memoryId];
	if (!memoryItem) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, { identifier: memoryId });
	}
	return memoryItem;
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
 * Determines the memory allocation id from the first argument.
 *
 * - Literal first args produce an `'__anonymous__N'` id.
 * - Plain identifier first args produce the identifier string as the id.
 * - Constant-style identifier first args with additional args (split-byte sequence)
 *   produce `'__anonymous__N'`.
 * - Constant-style identifier first args without additional args throw
 *   CONSTANT_NAME_AS_MEMORY_IDENTIFIER — bare constant names are not valid allocation names.
 * - Non-identifier, non-literal first args throw UNDECLARED_IDENTIFIER.
 */
function resolveAnonymousOrNamedMemoryId(
	first: Argument,
	hasAdditionalArgs: boolean,
	lineNumberAfterMacroExpansion: number,
	lineForError: AST[number],
	context: CompilationContext
): string {
	if (first.type === ArgumentType.LITERAL) {
		return '__anonymous__' + lineNumberAfterMacroExpansion;
	}
	if (first.type !== ArgumentType.IDENTIFIER) {
		// COMPILE_TIME_EXPRESSION should not reach here; normalization folds them before memory parsing.
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, { identifier: '' });
	}
	if (first.referenceKind === 'constant') {
		if (!hasAdditionalArgs) {
			throw getError(ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER, lineForError, context);
		}
		// Multiple args: anonymous split-byte sequence starting with a constant name
		return '__anonymous__' + lineNumberAfterMacroExpansion;
	}
	return first.value;
}

/**
 * Resolves the second (default-value) argument of a memory declaration directly from the
 * pre-classified AST argument. Reads referenceKind, targetMemoryId, and isEndAddress fields
 * set by the tokenizer during parsing rather than re-parsing the raw string.
 */
function resolveMemoryDefaultValue(arg: Argument, lineForError: AST[number], context: CompilationContext): number {
	if (arg.type === ArgumentType.LITERAL) {
		return arg.value;
	}

	if (arg.type !== ArgumentType.IDENTIFIER) {
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, { identifier: '' });
	}

	switch (arg.referenceKind) {
		case 'memory-reference': {
			const memoryItem = getMemoryItemOrThrow(arg.targetMemoryId!, lineForError, context);
			return arg.isEndAddress ? memoryItem.byteAddress + (memoryItem.wordAlignedSize - 1) * 4 : memoryItem.byteAddress;
		}

		case 'element-count': {
			const memoryItem = getMemoryItemOrThrow(arg.targetMemoryId!, lineForError, context);
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

	// Zero-argument scalar declaration: bare anonymous zero-initialized allocation (e.g. `int`, `float`).
	if (args.length === 0) {
		return { id: '__anonymous__' + lineNumberAfterMacroExpansion, defaultValue: 0 };
	}

	const first = args[0];
	const id = resolveAnonymousOrNamedMemoryId(
		first,
		args.length > 1,
		lineNumberAfterMacroExpansion,
		lineForError,
		context
	);

	// Anonymous literal (single arg) — no split-byte sequence
	if (first.type === ArgumentType.LITERAL && args.length === 1) {
		return { id, defaultValue: first.value };
	}

	// Split-byte sequence: literal or constant-style first arg with additional args
	if (first.type === ArgumentType.LITERAL || (first as ArgumentIdentifier).referenceKind === 'constant') {
		if (first.type === ArgumentType.LITERAL && !isByteLiteral(first)) {
			// Out-of-range first literal with extra args rejected to prevent silent miscompilation
			throw getError(ErrorCode.SPLIT_BYTE_CONSTANT_OUT_OF_RANGE, lineForError, context);
		}
		const tokens: SplitByteToken[] = [
			toSplitByteToken(first),
			...collectSplitByteTokens(args, 1, lineForError, context),
		];
		return { id, defaultValue: resolveSplitByteTokens(tokens, MAX_SPLIT_BYTE_WIDTH, lineForError, context) };
	}

	// Named declaration: resolve second-argument default or multi-token split-byte sequence
	if (args.length >= 3) {
		return {
			id,
			defaultValue: resolveSplitByteTokens(
				collectSplitByteTokens(args, 1, lineForError, context),
				MAX_SPLIT_BYTE_WIDTH,
				lineForError,
				context
			),
		};
	}

	return { id, defaultValue: args.length === 2 ? resolveMemoryDefaultValue(args[1], lineForError, context) : 0 };
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

		it('rejects unresolved intermodule address-reference identifiers that reach the parser', () => {
			// Intermodule address refs must be resolved or stripped by normalizeMemoryDeclaration
			// before reaching parseMemoryInstructionArguments; they must not silently return 0.
			const intermoduleRef = classifyIdentifier('&otherModule:someVar');
			const args: Argument[] = [classifyIdentifier('myVar'), intermoduleRef];
			expect(() =>
				parseMemoryInstructionArguments(
					{
						lineNumberBeforeMacroExpansion: 55,
						lineNumberAfterMacroExpansion: 55,
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

		it('resolves memory-reference default (&myVar) to byteAddress', () => {
			const args: Argument[] = [classifyIdentifier('ptr'), classifyIdentifier('&myVar')];
			const result = parseMemoryInstructionArguments(
				{
					lineNumberBeforeMacroExpansion: 160,
					lineNumberAfterMacroExpansion: 160,
					instruction: 'int*',
					arguments: args,
				},
				mockContext
			);
			expect(result.id).toBe('ptr');
			// myVar has byteAddress 100
			expect(result.defaultValue).toBe(100);
		});

		it('resolves memory-reference end-address default (myVar&) to last byte address', () => {
			const args: Argument[] = [classifyIdentifier('ptr'), classifyIdentifier('myVar&')];
			const result = parseMemoryInstructionArguments(
				{
					lineNumberBeforeMacroExpansion: 165,
					lineNumberAfterMacroExpansion: 165,
					instruction: 'int*',
					arguments: args,
				},
				mockContext
			);
			expect(result.id).toBe('ptr');
			// byteAddress + (wordAlignedSize - 1) * 4 = 100 + (5 - 1) * 4 = 116
			expect(result.defaultValue).toBe(116);
		});

		it('resolves element-count default (count(myVar)) to wordAlignedSize', () => {
			const args: Argument[] = [classifyIdentifier('n'), classifyIdentifier('count(myVar)')];
			const result = parseMemoryInstructionArguments(
				{
					lineNumberBeforeMacroExpansion: 170,
					lineNumberAfterMacroExpansion: 170,
					instruction: 'int',
					arguments: args,
				},
				mockContext
			);
			expect(result.id).toBe('n');
			// myVar has wordAlignedSize 5
			expect(result.defaultValue).toBe(5);
		});

		it('throws UNDECLARED_IDENTIFIER when memory-reference target does not exist', () => {
			const args: Argument[] = [classifyIdentifier('ptr'), classifyIdentifier('&noSuch')];
			expect(() =>
				parseMemoryInstructionArguments(
					{
						lineNumberBeforeMacroExpansion: 175,
						lineNumberAfterMacroExpansion: 175,
						instruction: 'int*',
						arguments: args,
					},
					mockContext
				)
			).toThrow();
		});

		it('throws UNDECLARED_IDENTIFIER when element-count target does not exist', () => {
			const args: Argument[] = [classifyIdentifier('n'), classifyIdentifier('count(noSuch)')];
			expect(() =>
				parseMemoryInstructionArguments(
					{
						lineNumberBeforeMacroExpansion: 180,
						lineNumberAfterMacroExpansion: 180,
						instruction: 'int',
						arguments: args,
					},
					mockContext
				)
			).toThrow();
		});
	});
}
