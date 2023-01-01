import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const xor: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_XOR], namespace };
};

export default xor;
