import { InstructionHandler } from '../types';

const _module: InstructionHandler = function (line, namespace, stack) {
	return { byteCode: [], namespace, stack };
};

export default _module;
