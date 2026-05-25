import { WASM_ELSE } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

import { popBlock, pushBlock } from '../utils/blockStack';

import type { ConditionBlockStackFrame, InstructionCompiler } from '@8f4e/compiler-spec';

/**
 * Instruction compiler for `else`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const _else: InstructionCompiler = (line, context) => {
	const block = popBlock(context) as ConditionBlockStackFrame;

	pushBlock(context, block);

	return saveByteCode(context, [WASM_ELSE]);
};

export default _else;
