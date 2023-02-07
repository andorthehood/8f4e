import { InstructionHandler } from '../types';

const _module: InstructionHandler = function (line, namespace) {
	return { byteCode: [], namespace };
};

export default _module;
