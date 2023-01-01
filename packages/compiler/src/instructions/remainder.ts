import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const remainder: InstructionHandler = function () {
	return [WASMInstruction.I32_REM_S];
};

export default remainder;
