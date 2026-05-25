import { i32const, localGet, WASM_I32_SUB } from '@8f4e/compiler-wasm-utils';
import { BlockType } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';

import type { InstructionCompiler, LoopIndexLine } from '@8f4e/compiler-spec';

const loopIndex: InstructionCompiler<LoopIndexLine> = (line, context) => {
	const loopBlock = [...context.blockStack].reverse().find(block => block.blockType === BlockType.LOOP);
	const local = context.locals[loopBlock!.loopCounterLocalName!]!;

	return saveByteCode(context, [...localGet(local.index), ...i32const(1), WASM_I32_SUB]);
};

export default loopIndex;
