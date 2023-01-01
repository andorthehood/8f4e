import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const shiftRightUnsigned: InstructionHandler = function () {
	return [Instruction.I32_SHR_U];
};

export default shiftRightUnsigned;
