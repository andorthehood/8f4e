import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const greaterThan: InstructionHandler = function () {
	return [Instruction.I32_GT_S];
};

export default greaterThan;
