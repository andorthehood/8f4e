import {
	br,
	i32const,
	localGet,
	localSet,
	WASM_BLOCK,
	WASM_END,
	WASM_I32_ADD,
	WASM_I32_GE_S,
	WASM_IF,
	WASM_LOOP,
	WASM_TYPE_VOID,
} from '@8f4e/compiler-wasm-utils';
import { ArgumentType, BlockType } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';

import { pushBlock } from '../utils/blockStack';

import type { InstructionCompiler, LoopLine } from '@8f4e/compiler-spec';

const DEFAULT_LOOP_CAP = 1000;

/**
 * Instruction compiler for `loop`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const loop: InstructionCompiler<LoopLine> = (line, context) => {
	const capArg = line.arguments[0];
	const effectiveCap =
		capArg !== undefined && capArg.type === ArgumentType.LITERAL
			? (capArg.value as number)
			: (context.loopCap ?? DEFAULT_LOOP_CAP);

	const infiniteLoopProtectionCounterName = '__infiniteLoopProtectionCounter' + line.lineNumberAfterMacroExpansion;
	const counterLocalIndex = Object.keys(context.locals).length;
	context.locals[infiniteLoopProtectionCounterName] = {
		isInteger: true,
		index: counterLocalIndex,
	};

	pushBlock(context, {
		expectedResultIsInteger: false,
		hasExpectedResult: false,
		blockType: BlockType.LOOP,
		loopCounterLocalName: infiniteLoopProtectionCounterName,
	});

	return saveByteCode(context, [
		...i32const(0),
		...localSet(counterLocalIndex),
		WASM_BLOCK,
		WASM_TYPE_VOID,
		WASM_LOOP,
		WASM_TYPE_VOID,
		...localGet(counterLocalIndex),
		...i32const(effectiveCap),
		WASM_I32_GE_S,
		WASM_IF,
		WASM_TYPE_VOID,
		...br(2),
		WASM_END,
		...localGet(counterLocalIndex),
		...i32const(1),
		WASM_I32_ADD,
		...localSet(counterLocalIndex),
	]);
};

export default loop;
