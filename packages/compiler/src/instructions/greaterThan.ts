import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const greaterThan: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_GT_S], namespace };
};

export default greaterThan;
