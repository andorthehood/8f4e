import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const equalToZero: InstructionHandler = function (line, context) {
	return { byteCode: [WASMInstruction.I32_EQZ], context };
};

export default equalToZero;
