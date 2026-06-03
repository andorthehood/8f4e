import type { InstructionCompiler, LoopIndexLine } from '@8f4e/compiler-spec';
import { i32const, localGet, WASM_I32_SUB } from '@8f4e/compiler-wasm-utils';

import { saveByteCode } from './utils/saveByteCode';

const loopIndex: InstructionCompiler<LoopIndexLine> = (line, context) => {
	const loopBlock = context.activeLoopBlocks[context.activeLoopBlocks.length - 1];
	const { loopCounterLocal: local } = loopBlock;

	return saveByteCode(context, [...localGet(local.index), ...i32const(1), WASM_I32_SUB]);
};

export default loopIndex;
