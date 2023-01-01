import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const end: InstructionHandler = function () {
	return [WASMInstruction.END];
};

export default end;
