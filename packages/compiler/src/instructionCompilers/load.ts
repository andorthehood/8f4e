import { ErrorCode, getError } from '../errors';
import { withValidation } from '../withValidation';
import i32load from '../wasmUtils/load/i32load';
import i32load16s from '../wasmUtils/load/i32load16s';
import i32load16u from '../wasmUtils/load/i32load16u';
import i32load8s from '../wasmUtils/load/i32load8s';
import i32load8u from '../wasmUtils/load/i32load8u';
import { compileSegment } from '../compiler';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `load` variants.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const instructionToByteCodeMap: Record<string, number[]> = {
	load: i32load(),
	load8s: i32load8s(),
	load8u: i32load8u(),
	load16s: i32load16s(),
	load16u: i32load16u(),
};

const load: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 integer operand exists
		const operand = context.stack.pop()!;

		if (operand.isSafeMemoryAddress) {
			context.stack.push({ isInteger: true, isNonZero: false });
			const instructions = instructionToByteCodeMap[line.instruction];
			if (!instructions) {
				throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
			}
			context.byteCode.push(...instructions);
			return context;
		} else {
			context.stack.push({ isInteger: true, isNonZero: false });
			const tempVariableName = '__loadAddress_temp_' + line.lineNumber;
			const instructions = instructionToByteCodeMap[line.instruction];
			if (!instructions) {
				throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
			}
			return compileSegment(
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
					...instructions.map((wasmInstruction: number) => {
						return `wasm ${wasmInstruction}`;
					}),
				],
				context
			);
		}
	}
);

export default load;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('load instruction compiler', () => {
		it('loads from a safe memory address', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false, isSafeMemoryAddress: true });

			load({ lineNumber: 1, instruction: 'load', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('wraps unsafe address with bounds check', () => {
			const context = createInstructionCompilerTestContext({ memoryByteSize: 32 });
			context.stack.push({ isInteger: true, isNonZero: false, isSafeMemoryAddress: false });

			load({ lineNumber: 2, instruction: 'load8u', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
