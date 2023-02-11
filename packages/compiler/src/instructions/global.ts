import { InstructionHandler } from '../types';

const global: InstructionHandler = function (line, namespace) {
	return {
		byteCode: [],
		namespace,
	};
};

export default global;
