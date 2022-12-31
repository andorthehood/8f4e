import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const shiftRightUnsigned: InstructionHandler = function () {
	return [Instruction.I32_SHR_U];
};

export default shiftRightUnsigned;
