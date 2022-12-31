import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const mul: InstructionHandler = function () {
	return [Instruction.I32_MUL];
};

export default mul;
