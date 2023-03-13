import { ArgumentType, InstructionHandler } from '../types';

const local: InstructionHandler = function (line, namespace, stack) {
	if (line.arguments[0].type === ArgumentType.LITERAL) {
		throw `1005: Expected identifier, got a value: '${line.arguments[0].value}'`;
	}

	return { byteCode: [], namespace: { ...namespace, locals: [...namespace.locals, line.arguments[0].value] }, stack };
};

export default local;
