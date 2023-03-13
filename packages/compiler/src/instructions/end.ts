import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const end: InstructionHandler = function (line, namespace, stack) {
	return { byteCode: [WASMInstruction.END], namespace, stack };
};

export default end;
