import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const and: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_AND], namespace };
};

export default and;
