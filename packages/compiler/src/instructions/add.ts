import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const add: InstructionHandler = function () {
	return [Instruction.I32_ADD];
};

export default add;
