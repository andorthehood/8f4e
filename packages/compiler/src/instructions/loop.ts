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
	const loopErrorSignalerName = 'loopErrorSignaler';

	return parseSegment(
		[
			`local int ${infiniteLoopProtectionCounterName}`,
			`int ${loopErrorSignalerName} 0`,
			`wasm ${WASMInstruction.LOOP}`,
			`wasm ${Type.VOID}`,

			`localGet ${infiniteLoopProtectionCounterName}`,
			'push 1000',
			'greaterOrEqual',
			'if void',
			` push &${loopErrorSignalerName}`,
			` push ${line.lineNumber}`,
			' store',
			` wasm ${WASMInstruction.RETURN}`,
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
