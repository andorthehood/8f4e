import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const greaterOrEqualUnsigned: InstructionHandler = function () {
	return [Instruction.I32_GE_U];
};

export default greaterOrEqualUnsigned;
