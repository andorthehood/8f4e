import { InstructionHandler } from '../types';

const local: InstructionHandler = function (line, namespace) {
	return { byteCode: [], namespace };
};

export default local;
