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
		// Non-null assertion is safe: withValidation confirmed 1 operand exists before this function was called
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



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'if (int)',
	`module if
int input 
int output

push &output
 push input
 if int
  push 1
 else
  push -1
 ifEnd
store

moduleEnd
`,
	[[{ input: 1 }, { output: 1 }]],
	[[{ input: 0 }, { output: -1 }]]
);

moduleTester(
	'if (float)',
	`module if
int input 
float output

push &output
 push input
 if float
  push 1.1
 else
  push -1.1
 ifEnd
store

moduleEnd
`,
	[[{ input: 1 }, { output: 1.1 }]],
	[[{ input: 0 }, { output: -1.1 }]]
);

moduleTester(
	'if (void)',
	`module if
int input 
int output

push input
if void
 push &output
  push 1
 store
else
 push &output
  push -1
 store
ifEnd

moduleEnd
`,
	[[{ input: 1 }, { output: 1 }]],
	[[{ input: 0 }, { output: -1 }]]
);
}
