import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const lessThan: InstructionHandler = function () {
	return [Instruction.I32_LT_S];
};

export default lessThan;
