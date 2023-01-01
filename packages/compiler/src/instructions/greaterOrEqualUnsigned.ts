import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const greaterOrEqualUnsigned: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_GE_U], namespace };
};

export default greaterOrEqualUnsigned;
