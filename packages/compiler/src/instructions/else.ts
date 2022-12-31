import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const _else: InstructionHandler = function () {
	return [Instruction.ELSE];
};

export default _else;
