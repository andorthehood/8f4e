import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const greaterThan: InstructionHandler = function () {
	return [Instruction.I32_GT_S];
};

export default greaterThan;
