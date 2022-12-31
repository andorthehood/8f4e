import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const xor: InstructionHandler = function () {
	return [Instruction.I32_XOR];
};

export default xor;
