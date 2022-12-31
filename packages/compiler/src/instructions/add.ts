import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const add: InstructionHandler = function () {
	return [Instruction.I32_ADD];
};

export default add;
