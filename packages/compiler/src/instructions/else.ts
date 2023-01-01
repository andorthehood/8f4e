import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const _else: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.ELSE], namespace };
};

export default _else;
