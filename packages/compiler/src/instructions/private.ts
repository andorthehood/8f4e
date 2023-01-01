import { InstructionHandler } from '../types';

const _private: InstructionHandler = function (line, namespace) {
	return { byteCode: [], namespace };
};

export default _private;
