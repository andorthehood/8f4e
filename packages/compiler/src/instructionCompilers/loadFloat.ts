import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';
import { f32load } from '../wasmUtils/instructionHelpers';
import { compileSegment } from '../compiler';

import type { InstructionCompiler } from '../types';

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
