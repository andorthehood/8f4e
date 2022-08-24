import { Instruction } from '@8f4e/bytecode-utils';

export default function mul() {
	return [Instruction.I32_MUL];
}
