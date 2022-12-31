import { InstructionHandler } from '../types';

const _const: InstructionHandler = function (line) {
	if (!line.arguments[0] || !line.arguments[1]) {
		throw '1002: Missing argument';
	}

	return [];
};

export default _const;
