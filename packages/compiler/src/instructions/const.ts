import { ErrorCode, getError } from '../errors';
import { ArgumentType, InstructionHandler } from '../types';

const _const: InstructionHandler = function (line, namespace, stack) {
	if (!line.arguments[0] || !line.arguments[1]) {
		throw getError(ErrorCode.MISSING_ARGUMENT, line);
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw getError(ErrorCode.EXPECTED_IDENTIFIER, line);
	}

	let value = { value: 0, isInteger: true };

	if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
		if (typeof namespace.consts[line.arguments[1].value] !== 'undefined') {
			value = namespace.consts[line.arguments[1].value];
		} else {
			throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line);
		}
	} else {
		value = line.arguments[1];
	}

	return {
		byteCode: [],
		namespace: { ...namespace, consts: { ...namespace.consts, [line.arguments[0].value]: value } },
		stack,
	};
};

export default _const;
