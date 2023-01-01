import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const remainder: InstructionHandler = function () {
	return [Instruction.I32_REM_S];
};

export default remainder;
