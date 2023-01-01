import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const equalToZero: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_EQZ], namespace };
};

export default equalToZero;
