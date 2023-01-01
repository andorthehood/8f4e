import { i32store } from '../wasmUtils/instructionHelpers';
import { InstructionHandler } from '../types';

const store: InstructionHandler = function () {
	return i32store();
};

export default store;
