import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const sub: InstructionHandler = function () {
	return [WASMInstruction.I32_SUB];
};

export default sub;
