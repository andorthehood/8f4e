import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const equalToZero: InstructionHandler = function () {
	return [WASMInstruction.I32_EQZ];
};

export default equalToZero;
