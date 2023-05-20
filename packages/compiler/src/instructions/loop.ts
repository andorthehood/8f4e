import WASMInstruction from '../wasmUtils/wasmInstruction';
import Type from '../wasmUtils/type';
import { InstructionHandler } from '../types';
import { ErrorCode, getError } from '../errors';
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
			'end',
			`localGet ${infiniteLoopProtectionCounterName}`,
			'push 1',
			'add',
			`localSet ${infiniteLoopProtectionCounterName}`,
		],
		context
	);
};

export default loop;
