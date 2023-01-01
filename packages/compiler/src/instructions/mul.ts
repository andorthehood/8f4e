import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const mul: InstructionHandler = function () {
	return [WASMInstruction.I32_MUL];
};

export default mul;
