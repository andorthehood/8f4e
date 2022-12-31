import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const sub: InstructionHandler = function () {
	return [Instruction.I32_SUB];
};

export default sub;
