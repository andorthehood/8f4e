import { Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';
import { BLOCK_TYPE } from '@8f4e/compiler-types';

import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';

import type { BlockLine, InstructionCompiler } from '@8f4e/compiler-types';

/**
 * Instruction compiler for `block`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const block: InstructionCompiler<BlockLine> = withValidation<BlockLine>(
	{
		scope: 'moduleOrFunction',
	},
	(line: BlockLine, context) => {
		const resultType = line.blockBlock?.resultType;

		if (resultType === 'float') {
			context.blockStack.push({
				expectedResultIsInteger: false,
				hasExpectedResult: true,
				blockType: BLOCK_TYPE.BLOCK,
			});
			return saveByteCode(context, [WASMInstruction.BLOCK, Type.F32]);
		}

		if (resultType === 'int') {
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
