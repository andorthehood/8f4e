import { InstructionHandler } from '../types';

const global: InstructionHandler = function (line, namespace, stack, blockStack) {
	return {
		byteCode: [],
		namespace,
		stack,
		blockStack
	};
};

export default global;
