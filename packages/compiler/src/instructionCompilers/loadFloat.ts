import { withValidation } from '../withValidation';
import f32load from '../wasmUtils/load/f32load';
import { compileSegment } from '../compiler';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `loadFloat`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const loadFloat: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		const operand = context.stack.pop()!;

		if (operand.isSafeMemoryAddress) {
			context.stack.push({ isInteger: false, isNonZero: false });
			return saveByteCode(context, f32load());
		} else {
			context.stack.push(operand);
			const tempVariableName = '__loadAddress_temp_' + line.lineNumber;
			const ret = compileSegment(
				[
					`local int ${tempVariableName}`,
					`localSet ${tempVariableName}`,
					`localGet ${tempVariableName}`,
					`push ${context.memoryByteSize - 1}`,
					'greaterThan',
					'if int',
					`push 0`,
					'else',
					`localGet ${tempVariableName}`,
					'ifEnd',
					...f32load().map(wasmInstruction => {
						return `wasm ${wasmInstruction}`;
					}),
				],
				context
			);
			context.stack.pop();
			context.stack.push({ isInteger: false, isNonZero: false });
			return ret;
		}
	}
);

export default loadFloat;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('loadFloat instruction compiler', () => {
		it('loads from a safe memory address', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false, isSafeMemoryAddress: true });

			loadFloat({ lineNumber: 1, instruction: 'loadFloat', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('wraps unsafe address with bounds check', () => {
			const context = createInstructionCompilerTestContext({ memoryByteSize: 16 });
			context.stack.push({ isInteger: true, isNonZero: false, isSafeMemoryAddress: false });

			loadFloat({ lineNumber: 2, instruction: 'loadFloat', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
