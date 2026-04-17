import {
	parseMemoryInstructionArgumentsShape,
	SyntaxRulesError,
	SyntaxErrorCode,
	type MemoryArgumentShape,
	type SplitByteToken,
} from '@8f4e/tokenizer';

import { ErrorCode, getError } from '../compilerError';
import { getEndByteAddress, getModuleEndByteAddress } from '../semantic/layoutAddresses';

import type { AST, CompilationContext } from '../types';

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

/**
 * Determines the memory allocation id from the tokenizer-classified first-argument shape.
 *
 * - `literal` and `split-byte-tokens` first args produce an `'__anonymous__N'` id.
 * - `identifier` first args produce the identifier string as the id (with reserved-name guard).
 * - `constant-identifier` first args (bare constant-style names) throw
 *   CONSTANT_NAME_AS_MEMORY_IDENTIFIER — they are not valid allocation names.
 * - Other shape types (intermodular refs, etc.) throw UNDECLARED_IDENTIFIER.
 */
function resolveIdFromShape(
	firstArg: MemoryArgumentShape,
	lineNumberAfterMacroExpansion: number,
	lineForError: AST[number],
	context: CompilationContext
): string {
	switch (firstArg.type) {
		case 'literal':
		case 'split-byte-tokens':
			return '__anonymous__' + lineNumberAfterMacroExpansion;
		case 'constant-identifier':
			// Bare constant-style names cannot be memory allocation names.
			throw getError(ErrorCode.CONSTANT_NAME_AS_MEMORY_IDENTIFIER, lineForError, context);
		case 'identifier':
			if (firstArg.value === 'this') {
				throw getError(ErrorCode.RESERVED_MEMORY_IDENTIFIER, lineForError, context, { identifier: firstArg.value });
			}
			return firstArg.value;
		default:
			// Intermodular references and other special forms are not valid allocation names.
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, { identifier: '' });
	}
}

/**
 * Resolves the second (default-value) argument from its tokenizer-classified shape.
 * Reads shape fields set by the tokenizer during argument classification rather than
 * re-parsing the raw string.
 */
function resolveMemoryDefaultValue(
	arg: MemoryArgumentShape,
	lineForError: AST[number],
	context: CompilationContext
): number {
	switch (arg.type) {
		case 'literal':
			return arg.value;

		case 'memory-reference': {
			if (arg.base === 'this') {
				if (!arg.isEndAddress) {
					return context.startingByteAddress;
				}
				return typeof context.currentModuleWordAlignedSize === 'number'
					? getModuleEndByteAddress(context.startingByteAddress, context.currentModuleWordAlignedSize)
					: 0;
			}
			const memoryItem = getMemoryItemOrThrow(arg.base, lineForError, context);
			return arg.isEndAddress
				? getEndByteAddress(memoryItem.byteAddress, memoryItem.wordAlignedSize)
				: memoryItem.byteAddress;
		}

		case 'element-count': {
			const memoryItem = getMemoryItemOrThrow(arg.base, lineForError, context);
			return memoryItem.wordAlignedSize;
		}

		default:
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, lineForError, context, {
				identifier: 'value' in arg ? (arg as { value: string }).value : '',
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

	// Delegate argument shape classification to the tokenizer. The tokenizer owns raw token-shape
	// classification (anonymous vs named, constant-style detection, split-byte sequence detection);
	// this function owns semantic resolution against constants, memory layout, and namespaces.
	let shape: ReturnType<typeof parseMemoryInstructionArgumentsShape>;
	try {
		shape = parseMemoryInstructionArgumentsShape(args);
	} catch (error) {
		if (error instanceof SyntaxRulesError && error.code === SyntaxErrorCode.SPLIT_HEX_MIXED_TOKENS) {
			// Re-throw as a compiler error to attach line/context info for diagnostics.
			throw getError(ErrorCode.SPLIT_HEX_MIXED_TOKENS, lineForError, context);
		}
		throw error;
	}

	const id = resolveIdFromShape(shape.firstArg, lineNumberAfterMacroExpansion, lineForError, context);

	// Anonymous split-byte sequence (e.g. `int 0xA8 0xFF` or `int HI LO`):
	if (shape.firstArg.type === 'split-byte-tokens') {
		return {
			id,
			defaultValue: resolveSplitByteTokens(shape.firstArg.tokens, MAX_SPLIT_BYTE_WIDTH, lineForError, context),
		};
	}

	// No default value present (e.g. `int name`, `float 42`):
	if (!shape.secondArg) {
		return {
			id,
			defaultValue: shape.firstArg.type === 'literal' ? shape.firstArg.value : 0,
		};
	}

	// Named declaration with split-byte default (e.g. `int name 0xA8 0xFF`):
	if (shape.secondArg.type === 'split-byte-tokens') {
		return {
			id,
			defaultValue: resolveSplitByteTokens(shape.secondArg.tokens, MAX_SPLIT_BYTE_WIDTH, lineForError, context),
		};
	}

	// Named declaration with a single default value:
	return { id, defaultValue: resolveMemoryDefaultValue(shape.secondArg, lineForError, context) };
}
