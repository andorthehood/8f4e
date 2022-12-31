import { br } from '@8f4e/bytecode-utils';
import { Instruction } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const loopEnd: InstructionHandler = function () {
	return [...br(0), Instruction.END];
};

export default loopEnd;
