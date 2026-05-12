import { br, i32const, localGet, localSet, Type, WASMInstruction } from '@8f4e/compiler-wasm-utils';
import { ArgumentType, BLOCK_TYPE } from '@8f4e/compiler-spec';

import { saveByteCode } from './utils/saveByteCode';

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

	context.blockStack.push({
		expectedResultIsInteger: false,
		hasExpectedResult: false,
		blockType: BLOCK_TYPE.LOOP,
		loopCounterLocalName: infiniteLoopProtectionCounterName,
	});

	return saveByteCode(context, [
		...i32const(0),
		...localSet(counterLocalIndex),
		WASMInstruction.BLOCK,
		Type.VOID,
		WASMInstruction.LOOP,
		Type.VOID,
		...localGet(counterLocalIndex),
		...i32const(effectiveCap),
		WASMInstruction.I32_GE_S,
		WASMInstruction.IF,
		Type.VOID,
		...br(2),
		WASMInstruction.END,
		...localGet(counterLocalIndex),
		...i32const(1),
		WASMInstruction.I32_ADD,
		...localSet(counterLocalIndex),
	]);
};

export default loop;
