import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const div: InstructionHandler = function () {
	return [Instruction.I32_DIV_S];
};

export default div;
