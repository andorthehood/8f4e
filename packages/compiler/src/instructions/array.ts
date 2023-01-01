import { InstructionHandler } from '../types';

const array: InstructionHandler = function (line, namespace) {
	return { byteCode: [], namespace };
};

export default array;
