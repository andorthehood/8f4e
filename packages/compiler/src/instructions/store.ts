import { i32store } from '../wasmUtils/instructionHelpers';
import { InstructionHandler } from '../types';

const store: InstructionHandler = function (line, namespace) {
	return { byteCode: i32store(), namespace };
};

export default store;
