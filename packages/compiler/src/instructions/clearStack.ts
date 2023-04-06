import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const clearStack: InstructionHandler = function (line, context) {
	const length = context.stack.length;
	context.stack = [];
	return { byteCode: new Array(length).fill(WASMInstruction.DROP), context };
};

export default clearStack;
