import { ArgumentType, BLOCK_TYPE } from '../types';
import { ErrorCode, getError } from '../errors';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { saveByteCode } from '../utils';
import { withValidation } from '../withValidation';

import type { InstructionCompiler } from '../types';

const block: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		if (!line.arguments[0] || line.arguments[0].type !== ArgumentType.IDENTIFIER) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].value === 'float') {
			context.blockStack.push({
				expectedResultIsInteger: false,
				hasExpectedResult: true,
				blockType: BLOCK_TYPE.BLOCK,
			});
			return saveByteCode(context, [WASMInstruction.BLOCK, Type.F32]);
		}

		if (line.arguments[0].value === 'int') {
			context.blockStack.push({
				expectedResultIsInteger: true,
				hasExpectedResult: true,
				blockType: BLOCK_TYPE.BLOCK,
			});
			return saveByteCode(context, [WASMInstruction.BLOCK, Type.I32]);
		}

		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.BLOCK,
		});

		return saveByteCode(context, [WASMInstruction.BLOCK, Type.VOID]);
	}
);

export default block;



if (import.meta.vitest) {
	const { moduleTester } = await import('./testUtils');

moduleTester(
	'block (int)',
	`module block
int input 
int output
    

push &output
block int
 push input
blockEnd
store
    
moduleEnd
`,
	[
		[{ input: 69 }, { output: 69 }],
		[{ input: 1 }, { output: 1 }],
		[{ input: -420 }, { output: -420 }],
	]
);

moduleTester(
	'block (float)',
	`module block
float input 
float output
    

push &output
block float
 push input
blockEnd
store
    
moduleEnd
`,
	[
		[{ input: 69.1 }, { output: 69.1 }],
		[{ input: 1.1 }, { output: 1.1 }],
		[{ input: -420.1 }, { output: -420.1 }],
	]
);
}
