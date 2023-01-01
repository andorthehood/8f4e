import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const shiftRightUnsigned: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_SHR_U], namespace };
};

export default shiftRightUnsigned;
