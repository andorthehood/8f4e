import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const xor: InstructionHandler = function () {
	return [Instruction.I32_XOR];
};

export default xor;
