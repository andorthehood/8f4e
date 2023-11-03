import { ErrorCode, getError } from '../errors';
import { InstructionHandler } from '../types';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { isInstructionIsInsideAModule } from '../utils';
import { parseSegment } from '../compiler';

const loop: InstructionHandler = function (line, context) {
	if (isInstructionIsInsideAModule(context.blockStack)) {
		throw getError(ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK, line, context);
	}

	context.blockStack.push({
		expectedResultIsInteger: false,
		hasExpectedResult: false,
		isModuleBlock: false,
		isGroupBlock: false,
		isLoop: true,
		isConditionBlock: false,
	});

	const infiniteLoopProtectionCounterName = '__infiniteLoopProtectionCounter' + line.lineNumber;
	const loopErrorSignalerName = '__loopErrorSignaler';

	return parseSegment(
		[
			`local int ${infiniteLoopProtectionCounterName}`,
			context.namespace.memory.has(loopErrorSignalerName) ? '' : `int ${loopErrorSignalerName} -1`,

			'push 0',
			`localSet ${infiniteLoopProtectionCounterName}`,

			`wasm ${WASMInstruction.BLOCK}`,
			`wasm ${Type.VOID}`,

			`wasm ${WASMInstruction.LOOP}`,
			`wasm ${Type.VOID}`,

			`localGet ${infiniteLoopProtectionCounterName}`,
			'push 1000',
			'greaterOrEqual',
			'if void',
			` push &${loopErrorSignalerName}`,
			` push ${line.lineNumber}`,
			' store',
			` branch 2`,
			'ifEnd',
			`localGet ${infiniteLoopProtectionCounterName}`,
			'push 1',
			'add',
			`localSet ${infiniteLoopProtectionCounterName}`,
		],
		context
	);
};

export default loop;
