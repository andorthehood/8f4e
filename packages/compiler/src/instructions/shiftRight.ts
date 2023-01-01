import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const shiftRight: InstructionHandler = function () {
	return [Instruction.I32_SHR_S];
};

export default shiftRight;
