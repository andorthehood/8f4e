import { br } from '../bytecodeUtils/instructionHelpers';
import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const loopEnd: InstructionHandler = function () {
	return [...br(0), Instruction.END];
};

export default loopEnd;
