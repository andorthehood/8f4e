import { br } from '@8f4e/bytecode-utils';

import { ArgumentType, InstructionHandler } from '../types';

const branch: InstructionHandler = function branch(line) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		throw `'1004: Expected value, got an identifier: '${line.arguments[0].value}''`;
	} else {
		return br(line.arguments[0].value);
	}
};

export default branch;
