import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const greaterOrEqualUnsigned: InstructionHandler = function () {
	return [WASMInstruction.I32_GE_U];
};

export default greaterOrEqualUnsigned;
