import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const greaterThan: InstructionHandler = function () {
	return [WASMInstruction.I32_GT_S];
};

export default greaterThan;
