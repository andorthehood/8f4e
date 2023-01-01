import { InstructionHandler } from '../types';

const inputPointer: InstructionHandler = function (line, namespace) {
	return { byteCode: [], namespace };
};

export default inputPointer;
