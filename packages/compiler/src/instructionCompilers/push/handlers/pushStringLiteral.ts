import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { ArgumentType } from '../../../types';
import i32const from '../../../wasmUtils/const/i32const';

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
	// Array.from iterates by Unicode code point; & 0xff clamps each to 0..255
	const bytes = Array.from(argument.value, ch => ch.charCodeAt(0) & 0xff);
	for (const byte of bytes) {
		context.stack.push({ isInteger: true, isNonZero: byte !== 0 });
		saveByteCode(context, i32const(byte));
	}
	return context;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('pushStringLiteral', () => {
		it('emits one i32.const per byte in source order', () => {
			const context = createInstructionCompilerTestContext();
			const arg: ArgumentStringLiteral = { type: ArgumentType.STRING_LITERAL, value: 'hi' };

			pushStringLiteral(arg, context);

			// 'h' = 104, 'i' = 105
			expect(context.byteCode).toEqual([...i32const(104), ...i32const(105)]);
			expect(context.stack).toEqual([
				{ isInteger: true, isNonZero: true },
				{ isInteger: true, isNonZero: true },
			]);
		});

		it('pushes nothing for an empty string', () => {
			const context = createInstructionCompilerTestContext();
			const arg: ArgumentStringLiteral = { type: ArgumentType.STRING_LITERAL, value: '' };

			pushStringLiteral(arg, context);

			expect(context.byteCode).toEqual([]);
			expect(context.stack).toEqual([]);
		});

		it('emits i32.const 0 for null byte and marks isNonZero false', () => {
			const context = createInstructionCompilerTestContext();
			const arg: ArgumentStringLiteral = { type: ArgumentType.STRING_LITERAL, value: '\x00' };

			pushStringLiteral(arg, context);

			expect(context.byteCode).toEqual(i32const(0));
			expect(context.stack[0]).toEqual({ isInteger: true, isNonZero: false });
		});

		it('expands "hello" to 5 byte pushes', () => {
			const context = createInstructionCompilerTestContext();
			const arg: ArgumentStringLiteral = { type: ArgumentType.STRING_LITERAL, value: 'hello' };

			pushStringLiteral(arg, context);

			expect(context.stack).toHaveLength(5);
			// h=104, e=101, l=108, l=108, o=111
			const expected = [...i32const(104), ...i32const(101), ...i32const(108), ...i32const(108), ...i32const(111)];
			expect(context.byteCode).toEqual(expected);
		});
	});
}
