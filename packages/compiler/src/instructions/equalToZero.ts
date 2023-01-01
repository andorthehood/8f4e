import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const equalToZero: InstructionHandler = function () {
	return [Instruction.I32_EQZ];
};

export default equalToZero;
