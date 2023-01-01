import { br_if } from '../bytecodeUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';

const branchIfTrue: InstructionHandler = function (line) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		throw `'1004: Expected value, got an identifier: '${line.arguments[0].value}''`;
	} else {
		return br_if(line.arguments[0].value);
	}
};

export default branchIfTrue;
