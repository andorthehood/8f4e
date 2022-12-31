import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const lessOrEqual: InstructionHandler = function () {
	return [Instruction.I32_LE_S];
};

export default lessOrEqual;
