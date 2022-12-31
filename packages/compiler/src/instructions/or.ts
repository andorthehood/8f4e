import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const or: InstructionHandler = function () {
	return [Instruction.I32_OR];
};

export default or;
