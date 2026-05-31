import type { InstructionCompiler, LoopIndexLine } from '@8f4e/compiler-spec';
import { i32const, localGet, WASM_I32_SUB } from '@8f4e/compiler-wasm-utils';

import { findNearestLoopBlock } from '../utils/blockStack';
import { saveByteCode } from './utils/saveByteCode';

const loopIndex: InstructionCompiler<LoopIndexLine> = (line, context) => {
	const loopBlock = findNearestLoopBlock(context);
	const { loopCounterLocal: local } = loopBlock;

	return saveByteCode(context, [...localGet(local.index), ...i32const(1), WASM_I32_SUB]);
};

export default loopIndex;
