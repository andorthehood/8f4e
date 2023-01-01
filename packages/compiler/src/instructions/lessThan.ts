import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const lessThan: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_LT_S], namespace };
};

export default lessThan;
