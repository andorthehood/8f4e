import { ArgumentType, type SplitByteToken } from '@8f4e/tokenizer';

import { ErrorCode, getError } from '../compilerError';
import { getEndByteAddress, getModuleEndByteAddress } from '../semantic/layoutAddresses';

import type { AST, Argument, ArgumentIdentifier, ArgumentLiteral, CompilationContext } from '../types';

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
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, {
			identifier: memoryId,
		});
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
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, {
			identifier: '',
		});
	}
	if (first.referenceKind === 'constant') {
		if (!hasAdditionalArgs) {
			throw getError(ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER, lineForError, context);
		}
		// Multiple args: anonymous split-byte sequence starting with a constant name
		return '__anonymous__' + lineNumberAfterMacroExpansion;
	}
	if (first.referenceKind === 'plain' && first.value === 'this') {
		throw getError(ErrorCode.RESERVED_MEMORY_IDENTIFIER, lineForError, context, { identifier: first.value });
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
		throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, {
			identifier: '',
		});
	}

	switch (arg.referenceKind) {
		case 'memory-reference': {
			if (arg.targetMemoryId === 'this') {
				if (!arg.isEndAddress) {
					return context.startingByteAddress;
				}
				return typeof context.currentModuleWordAlignedSize === 'number'
					? getModuleEndByteAddress(context.startingByteAddress, context.currentModuleWordAlignedSize)
					: 0;
			}
			const memoryItem = getMemoryItemOrThrow(arg.targetMemoryId, lineForError, context);
			return arg.isEndAddress
				? getEndByteAddress(memoryItem.byteAddress, memoryItem.wordAlignedSize)
				: memoryItem.byteAddress;
		}

		case 'element-count': {
			const memoryItem = getMemoryItemOrThrow(arg.targetMemoryId, lineForError, context);
			return memoryItem.wordAlignedSize;
		}

		default:
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, {
				identifier: arg.value,
			});
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
		return {
			id: '__anonymous__' + lineNumberAfterMacroExpansion,
			defaultValue: 0,
		};
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
		return {
			id,
			defaultValue: resolveSplitByteTokens(tokens, MAX_SPLIT_BYTE_WIDTH, lineForError, context),
		};
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

	return {
		id,
		defaultValue: args.length === 2 ? resolveMemoryDefaultValue(args[1], lineForError, context) : 0,
	};
}
