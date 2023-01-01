import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const div: InstructionHandler = function () {
	return [WASMInstruction.I32_DIV_S];
};

export default div;
