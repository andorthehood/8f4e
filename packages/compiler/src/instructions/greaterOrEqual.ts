import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const greaterOrEqual: InstructionHandler = function () {
	return [Instruction.I32_GE_S];
};

export default greaterOrEqual;
