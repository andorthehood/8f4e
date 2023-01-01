import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const shiftRight: InstructionHandler = function () {
	return [WASMInstruction.I32_SHR_S];
};

export default shiftRight;
