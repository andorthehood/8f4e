import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const add: InstructionHandler = function (line, namespace) {
	return {
		byteCode: [WASMInstruction.I32_ADD],
		namespace,
	};
};

export default add;
