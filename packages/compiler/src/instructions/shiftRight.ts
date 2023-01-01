import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const shiftRight: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_SHR_S], namespace };
};

export default shiftRight;
