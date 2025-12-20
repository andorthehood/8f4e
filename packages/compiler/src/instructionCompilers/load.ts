import { ErrorCode, getError } from '../errors';
import { saveByteCode, withValidation } from '../utils';
import { i32load, i32load8s, i32load8u, i32load16s, i32load16u } from '../wasmUtils/instructionHelpers';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

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
		onInvalidTypes: ErrorCode.ONLY_INTEGERS,
	},
	(line, context) => {
		const operand = context.stack.pop()!;

		if (operand.isSafeMemoryAddress) {
			context.stack.push({ isInteger: true, isNonZero: false });
			const instructions = instructionToByteCodeMap[line.instruction];
			if (!instructions) {
				throw getError(ErrorCode.UNRECOGNISED_INSTRUCTION, line, context);
			}
			return saveByteCode(context, instructions);
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
