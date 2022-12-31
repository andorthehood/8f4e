import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const greaterOrEqualUnsigned: InstructionHandler = function () {
	return [Instruction.I32_GE_U];
};

export default greaterOrEqualUnsigned;
