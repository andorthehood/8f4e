import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const shiftRight: InstructionHandler = function () {
	return [Instruction.I32_SHR_S];
};

export default shiftRight;
