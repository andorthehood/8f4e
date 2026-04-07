import { localGet } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';

import type { CompilationContext, PushIdentifierLine } from '../../../types';

export default function pushLocal(line: PushIdentifierLine, context: CompilationContext): CompilationContext {
	const local = context.locals[line.arguments[0].value]!;

	context.stack.push({ isInteger: local.isInteger, ...(local.isFloat64 ? { isFloat64: true } : {}), isNonZero: false });
	return saveByteCode(context, localGet(local.index));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('pushLocal', () => {
		it('pushes a local via local.get', () => {
			const context = createInstructionCompilerTestContext({
				locals: {
					temp: { isInteger: true, index: 3 },
				},
			});

			pushLocal(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('temp')],
				} as PushIdentifierLine,
				context
			);

			expect(context.byteCode).toEqual(localGet(3));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: false }]);
		});

		it('preserves isFloat64 on the stack item for a float64 local', () => {
			const context = createInstructionCompilerTestContext({
				locals: {
					dbl: { isInteger: false, isFloat64: true, index: 1 },
				},
			});

			pushLocal(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('dbl')],
				} as PushIdentifierLine,
				context
			);

			expect(context.byteCode).toEqual(localGet(1));
			expect(context.stack).toEqual([{ isInteger: false, isFloat64: true, isNonZero: false }]);
		});

		it('does not set isFloat64 for a float32 local', () => {
			const context = createInstructionCompilerTestContext({
				locals: {
					flt: { isInteger: false, index: 2 },
				},
			});

			pushLocal(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'push',
					arguments: [classifyIdentifier('flt')],
				} as PushIdentifierLine,
				context
			);

			expect(context.byteCode).toEqual(localGet(2));
			expect(context.stack[0].isFloat64).toBeUndefined();
			expect(context.stack[0].isInteger).toBe(false);
		});
	});
}
