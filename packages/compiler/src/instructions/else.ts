import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const _else: InstructionHandler = function () {
	return [WASMInstruction.ELSE];
};

export default _else;
