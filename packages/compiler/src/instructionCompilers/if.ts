import { ArgumentType, BLOCK_TYPE } from '../types';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const _if: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		if (line.arguments[0] && line.arguments[0].type === ArgumentType.IDENTIFIER && line.arguments[0].value === 'void') {
			context.blockStack.push({
				expectedResultIsInteger: false,
				hasExpectedResult: false,
				blockType: BLOCK_TYPE.CONDITION,
			});
			return saveByteCode(context, [WASMInstruction.IF, Type.VOID]);
		}

		if (
			line.arguments[0] &&
			line.arguments[0].type === ArgumentType.IDENTIFIER &&
			line.arguments[0].value === 'float'
		) {
			context.blockStack.push({
				expectedResultIsInteger: false,
				hasExpectedResult: true,
				blockType: BLOCK_TYPE.CONDITION,
			});
			return saveByteCode(context, [WASMInstruction.IF, Type.F32]);
		}

		context.blockStack.push({
			expectedResultIsInteger: true,
			hasExpectedResult: true,
			blockType: BLOCK_TYPE.CONDITION,
		});
		return saveByteCode(context, [WASMInstruction.IF, Type.I32]);
	}
);

export default _if;
