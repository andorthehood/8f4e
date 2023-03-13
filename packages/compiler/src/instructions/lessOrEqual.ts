import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const lessOrEqual: InstructionHandler = function (line, namespace, stack) {
	return { byteCode: [WASMInstruction.I32_LE_S], namespace, stack };
};

export default lessOrEqual;
