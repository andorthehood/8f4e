import { i32const } from '../bytecodeUtils/instructionHelpers';
import Instruction from '../bytecodeUtils/instruction';
import { WORD_LENGTH } from '../consts';
import { InstructionHandler } from '../types';

const pointerForward: InstructionHandler = function () {
	return [...i32const(WORD_LENGTH), Instruction.I32_ADD];
};

export default pointerForward;
