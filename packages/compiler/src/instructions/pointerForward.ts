import { i32const, Instruction } from '@8f4e/bytecode-utils';

import { WORD_LENGTH } from '../consts';
import { InstructionHandler } from '../types';

const pointerForward: InstructionHandler = function () {
	return [...i32const(WORD_LENGTH), Instruction.I32_ADD];
};

export default pointerForward;
