import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const add: InstructionHandler = function () {
	return [WASMInstruction.I32_ADD];
};

export default add;
