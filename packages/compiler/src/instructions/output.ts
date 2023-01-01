import { InstructionHandler } from '../types';

const output: InstructionHandler = function (line, namespace) {
	return { byteCode: [], namespace };
};

export default output;
