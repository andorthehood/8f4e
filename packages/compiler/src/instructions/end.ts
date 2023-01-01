import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const end: InstructionHandler = function () {
	return [Instruction.END];
};

export default end;
