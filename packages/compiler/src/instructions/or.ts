import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const or: InstructionHandler = function () {
	return [WASMInstruction.I32_OR];
};

export default or;
