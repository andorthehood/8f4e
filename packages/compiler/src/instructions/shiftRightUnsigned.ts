import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const shiftRightUnsigned: InstructionHandler = function () {
	return [WASMInstruction.I32_SHR_U];
};

export default shiftRightUnsigned;
