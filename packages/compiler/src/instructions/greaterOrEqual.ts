import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const greaterOrEqual: InstructionHandler = function () {
	return [WASMInstruction.I32_GE_S];
};

export default greaterOrEqual;
