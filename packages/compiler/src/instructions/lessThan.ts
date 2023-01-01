import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const lessThan: InstructionHandler = function () {
	return [Instruction.I32_LT_S];
};

export default lessThan;
