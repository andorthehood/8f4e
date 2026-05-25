import { i32const, localGet, WASM_I32_SUB } from '@8f4e/compiler-wasm-utils';
import { BlockType, ErrorCode } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';

import { getError } from '../compilerError';
import { findExpectedBlock } from '../utils/blockStack';

import type { InstructionCompiler, LoopIndexLine } from '@8f4e/compiler-spec';

const loopIndex: InstructionCompiler<LoopIndexLine> = (line, context) => {
	const loopBlock = findExpectedBlock(context, BlockType.LOOP);
	const local = loopBlock?.loopCounterLocalName ? context.locals[loopBlock.loopCounterLocalName] : undefined;

	if (!local) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_LOOP, line, context);
	}

	return saveByteCode(context, [...localGet(local.index), ...i32const(1), WASM_I32_SUB]);
};

export default loopIndex;
