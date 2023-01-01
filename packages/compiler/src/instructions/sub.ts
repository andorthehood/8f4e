import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const sub: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_SUB], namespace };
};

export default sub;
