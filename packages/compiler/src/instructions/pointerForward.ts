import { i32const, Instruction } from '@8f4e/bytecode-utils';

import { WORD_LENGTH } from '../consts';

export default function () {
	return [...i32const(WORD_LENGTH), Instruction.I32_ADD];
}
