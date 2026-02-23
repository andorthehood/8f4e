import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { ArgumentType } from '../../../types';
import f64const from '../../../wasmUtils/const/f64const';
import i32const from '../../../wasmUtils/const/i32const';
import { constOpcode, kindToStackItem, resolveArgumentValueKind } from '../shared';

import type { ArgumentLiteral, CompilationContext } from '../../../types';

export default function pushLiteral(argument: ArgumentLiteral, context: CompilationContext): CompilationContext {
	const kind = resolveArgumentValueKind(argument);
	context.stack.push(kindToStackItem(kind, { isNonZero: argument.value !== 0 }));
	return saveByteCode(context, constOpcode[kind](argument.value));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('pushLiteral', () => {
		it('emits i32.const for integer literals and updates stack metadata', () => {
			const context = createInstructionCompilerTestContext();
			const literal: ArgumentLiteral = { type: ArgumentType.LITERAL, value: 7, isInteger: true };

			pushLiteral(literal, context);

			expect(context.byteCode).toEqual(i32const(7));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true }]);
		});

		it('emits f64.const for float64 literals and tracks isFloat64', () => {
			const context = createInstructionCompilerTestContext();
			const literal: ArgumentLiteral = { type: ArgumentType.LITERAL, value: 1.5, isInteger: false, isFloat64: true };

			pushLiteral(literal, context);

			expect(context.byteCode).toEqual(f64const(1.5));
			expect(context.stack).toEqual([{ isInteger: false, isFloat64: true, isNonZero: true }]);
		});
	});
}
