import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const div: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_DIV_S], namespace };
};

export default div;
