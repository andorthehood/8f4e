import { ArgumentType, InstructionHandler } from '../types';

const _const: InstructionHandler = function (line, namespace) {
	if (!line.arguments[0] || !line.arguments[1]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw `'1005: Expected identifier, got a value: '${line.arguments[0].value}''`;
	}

	if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
		throw `'1004: Expected value, got an identifier: '${line.arguments[1].value}''`;
	}

	return {
		byteCode: [],
		namespace: { ...namespace, consts: { ...namespace.consts, [line.arguments[0].value]: line.arguments[1].value } },
	};
};

export default _const;
