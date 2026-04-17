import { i32const } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../../../utils/compilation';

import type { ArgumentStringLiteral, CompilationContext } from '../../../types';

/**
 * Expands a string literal argument into one i32.const per byte (source order).
 * Characters are encoded as their code point value (0..255 via charCodeAt & 0xff).
 * Array.from iterates by UTF-16 code unit; for supplementary characters (> U+FFFF)
 * the high surrogate value is clamped to 0..255. For ASCII/Latin-1 strings this
 * produces the expected byte sequence.
 * No null terminator is appended.
 */
export default function pushStringLiteral(
	argument: ArgumentStringLiteral,
	context: CompilationContext
): CompilationContext {
	// Array.from iterates by UTF-16 code unit; & 0xff clamps each to 0..255
	const bytes = Array.from(argument.value, ch => ch.charCodeAt(0) & 0xff);
	for (const byte of bytes) {
		context.stack.push({ isInteger: true, isNonZero: byte !== 0 });
		saveByteCode(context, i32const(byte));
	}
	return context;
}
