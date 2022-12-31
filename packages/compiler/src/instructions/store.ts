import { i32store } from '@8f4e/bytecode-utils';

import { InstructionHandler } from '../types';

const store: InstructionHandler = function () {
	return i32store();
};

export default store;
