import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const sub: InstructionHandler = function () {
	return [Instruction.I32_SUB];
};

export default sub;
