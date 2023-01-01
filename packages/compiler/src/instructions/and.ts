import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const and: InstructionHandler = function () {
	return [WASMInstruction.I32_AND];
};

export default and;
