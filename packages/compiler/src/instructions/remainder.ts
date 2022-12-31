import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const remainder: InstructionHandler = function () {
	return [Instruction.I32_REM_S];
};

export default remainder;
