import Instruction from '../bytecodeUtils/instruction';
import { InstructionHandler } from '../types';

const _else: InstructionHandler = function () {
	return [Instruction.ELSE];
};

export default _else;
