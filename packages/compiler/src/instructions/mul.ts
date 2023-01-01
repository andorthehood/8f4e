import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const mul: InstructionHandler = function () {
	return [Instruction.I32_MUL];
};

export default mul;
