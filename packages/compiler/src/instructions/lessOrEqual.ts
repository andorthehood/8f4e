import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const lessOrEqual: InstructionHandler = function () {
	return [Instruction.I32_LE_S];
};

export default lessOrEqual;
