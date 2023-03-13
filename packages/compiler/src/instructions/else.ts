import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const _else: InstructionHandler = function (line, namespace, stack) {
	return { byteCode: [WASMInstruction.ELSE], namespace, stack };
};

export default _else;
