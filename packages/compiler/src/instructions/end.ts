import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const end: InstructionHandler = function () {
	return [Instruction.END];
};

export default end;
