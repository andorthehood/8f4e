import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const greaterOrEqual: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_GE_S], namespace };
};

export default greaterOrEqual;
