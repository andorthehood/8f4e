import WASMInstruction from '../wasmUtils/wasmInstruction';
import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `abs`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const abs: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		if (operand.isInteger) {
			context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });
			const valueName = '__absify_value' + line.lineNumber;

			return compileSegment(
				[
					`local int ${valueName}`,
					`localSet ${valueName}`,
					`localGet ${valueName}`,
					'push 0',
					'lessThan',
					'if',
					' push 0',
					` localGet ${valueName}`,
					' sub',
					'else',
					` localGet ${valueName}`,
					'ifEnd',
				],
				context
			);
		} else {
			context.stack.push({ isInteger: false, isNonZero: operand.isNonZero });
			context.byteCode.push(...[WASMInstruction.F32_ABS]);
			return context;
		}
	}
);

export default abs;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('abs instruction compiler', () => {
		it('emits F32_ABS for float operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: true });

			abs({ lineNumber: 1, instruction: 'abs', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('compiles int abs via segment instructions', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true });

			abs({ lineNumber: 3, instruction: 'abs', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
				locals: context.namespace.locals,
			}).toMatchSnapshot();
		});
	});
}
