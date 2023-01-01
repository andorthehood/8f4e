import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const mul: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_MUL], namespace };
};

export default mul;
