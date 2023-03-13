import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const lessThan: InstructionHandler = function (line, namespace, stack) {
	return { byteCode: [WASMInstruction.I32_LT_S], namespace, stack };
};

export default lessThan;
