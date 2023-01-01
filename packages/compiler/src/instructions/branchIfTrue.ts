import { br_if } from '../wasmUtils/instructionHelpers';
import { ArgumentType, InstructionHandler } from '../types';

const branchIfTrue: InstructionHandler = function (line, namespace) {
	if (!line.arguments[0]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === ArgumentType.IDENTIFIER) {
		throw `'1004: Expected value, got an identifier: '${line.arguments[0].value}''`;
	} else {
		return { byteCode: br_if(line.arguments[0].value), namespace };
	}
};

export default branchIfTrue;
