import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const div: InstructionHandler = function () {
	return [Instruction.I32_DIV_S];
};

export default div;
