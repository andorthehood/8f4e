import { br } from '@8f4e/bytecode-utils';
import { Instruction } from '@8f4e/bytecode-utils';

export default function loopEnd() {
	return [...br(0), Instruction.END];
}
