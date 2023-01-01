import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const end: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.END], namespace };
};

export default end;
