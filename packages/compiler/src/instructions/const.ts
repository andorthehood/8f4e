import { ArgumentType, InstructionHandler } from '../types';

const _const: InstructionHandler = function (line, namespace) {
	if (!line.arguments[0] || !line.arguments[1]) {
		throw '1002: Missing argument';
	}

	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw `1005: Expected identifier, got a value: '${line.arguments[0].value}'`;
	}

	let value = 0;

	if (line.arguments[1].type === ArgumentType.IDENTIFIER) {
		if (typeof namespace.consts[line.arguments[1].value] !== 'undefined') {
			value = namespace.consts[line.arguments[1].value];
		} else {
			throw `1003: Undeclared identifier: '${line.arguments[1].value}'`;
		}
	} else {
		value = line.arguments[1].value;
	}

	return {
		byteCode: [],
		namespace: { ...namespace, consts: { ...namespace.consts, [line.arguments[0].value]: value } },
	};
};

export default _const;
