import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const lessThan: InstructionHandler = function () {
	return [WASMInstruction.I32_LT_S];
};

export default lessThan;
