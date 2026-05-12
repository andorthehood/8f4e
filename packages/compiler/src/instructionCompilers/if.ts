import { Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';
import { BLOCK_TYPE } from '@8f4e/compiler-spec';

import { saveByteCode } from '../utils/compilation';

import type { IfLine, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `if`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const _if: InstructionCompiler<IfLine> = (line, context) => {
	// Non-null assertion is safe: instruction validation confirmed 1 operand exists before this function was called
	context.stack.pop()!;

	if (line.ifBlock?.resultType === 'float') {
		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: true,
			blockType: BLOCK_TYPE.CONDITION,
		});
		return saveByteCode(context, [WASMInstruction.IF, Type.F32]);
	}

	if (line.ifBlock?.resultType === 'int') {
		context.blockStack.push({
			expectedResultIsInteger: true,
			hasExpectedResult: true,
			blockType: BLOCK_TYPE.CONDITION,
		});
		return saveByteCode(context, [WASMInstruction.IF, Type.I32]);
	}

	// No declared result type on the matching ifEnd means no block result.
	context.blockStack.push({
		expectedResultIsInteger: false,
		hasExpectedResult: false,
		blockType: BLOCK_TYPE.CONDITION,
	});
	return saveByteCode(context, [WASMInstruction.IF, Type.VOID]);
};

export default _if;
