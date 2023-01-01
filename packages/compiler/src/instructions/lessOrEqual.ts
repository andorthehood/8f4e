import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const lessOrEqual: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_LE_S], namespace };
};

export default lessOrEqual;
