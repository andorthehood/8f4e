import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const greaterOrEqual: InstructionHandler = function () {
	return [Instruction.I32_GE_S];
};

export default greaterOrEqual;
