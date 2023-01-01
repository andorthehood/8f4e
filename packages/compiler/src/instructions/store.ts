import { i32store } from '../bytecodeUtils/instructionHelpers';
import { InstructionHandler } from '../types';

const store: InstructionHandler = function () {
	return i32store();
};

export default store;
