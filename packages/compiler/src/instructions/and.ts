import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const and: InstructionHandler = function () {
	return [Instruction.I32_AND];
};

export default and;
