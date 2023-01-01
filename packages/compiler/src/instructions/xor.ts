import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const xor: InstructionHandler = function () {
	return [WASMInstruction.I32_XOR];
};

export default xor;
