import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const equalToZero: InstructionHandler = function () {
	return [Instruction.I32_EQZ];
};

export default equalToZero;
