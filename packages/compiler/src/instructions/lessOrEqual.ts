import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const lessOrEqual: InstructionHandler = function () {
	return [WASMInstruction.I32_LE_S];
};

export default lessOrEqual;
