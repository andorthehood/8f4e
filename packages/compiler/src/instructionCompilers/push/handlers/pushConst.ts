import { saveByteCode } from '../../../utils/compilation';
import createInstructionCompilerTestContext from '../../../utils/testUtils';
import { ArgumentType } from '../../../types';
import f64const from '../../../wasmUtils/const/f64const';
import i32const from '../../../wasmUtils/const/i32const';
import { constOpcode, kindToStackItem, resolveArgumentValueKind } from '../shared';
import { resolveConstantValueOrExpressionOrThrow } from '../../../utils/resolveConstantValue';

import type { AST, CompilationContext } from '../../../types';

export default function pushConst(line: AST[number], context: CompilationContext): CompilationContext {
	const argument = line.arguments[0] as { value: string };
	const constItem = resolveConstantValueOrExpressionOrThrow(argument.value, line, context);
	const kind = resolveArgumentValueKind(constItem);
	context.stack.push(kindToStackItem(kind, { isNonZero: constItem.value !== 0 }));
	return saveByteCode(context, constOpcode[kind](constItem.value));
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('pushConst', () => {
		it('pushes int constants with i32.const', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					consts: {
						ANSWER: { value: 42, isInteger: true },
					},
				},
			});

			pushConst(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'ANSWER' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(i32const(42));
			expect(context.stack).toEqual([{ isInteger: true, isNonZero: true }]);
		});

		it('pushes float64 constants with f64.const', () => {
			const context = createInstructionCompilerTestContext({
				namespace: {
					...createInstructionCompilerTestContext().namespace,
					consts: {
						PI64: { value: 3.14, isInteger: false, isFloat64: true },
					},
				},
			});

			pushConst(
				{
					lineNumber: 1,
					instruction: 'push',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'PI64' }],
				} as AST[number],
				context
			);

			expect(context.byteCode).toEqual(f64const(3.14));
			expect(context.stack).toEqual([{ isInteger: false, isFloat64: true, isNonZero: true }]);
		});
	});
}
