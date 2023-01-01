import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const and: InstructionHandler = function () {
	return [Instruction.I32_AND];
};

export default and;
