import { InstructionHandler } from '../types';

const global: InstructionHandler = function (line, context) {
	return {
		byteCode: [],
		context,
	};
};

export default global;
