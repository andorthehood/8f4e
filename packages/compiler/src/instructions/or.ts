import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const or: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_OR], namespace };
};

export default or;
