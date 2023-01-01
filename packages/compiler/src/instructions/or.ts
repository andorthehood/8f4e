import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const or: InstructionHandler = function () {
	return [Instruction.I32_OR];
};

export default or;
