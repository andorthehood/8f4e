import { InstructionHandler } from '../types';

const _public: InstructionHandler = function (line, namespace) {
	return { byteCode: [], namespace };
};

export default _public;
