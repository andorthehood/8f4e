import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const equalToZero: InstructionHandler = function (line, namespace, stack, blockStack) {
	return { byteCode: [WASMInstruction.I32_EQZ], namespace, stack, blockStack };
};

export default equalToZero;
