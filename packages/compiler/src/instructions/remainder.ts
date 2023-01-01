import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const remainder: InstructionHandler = function (line, namespace) {
	return { byteCode: [WASMInstruction.I32_REM_S], namespace };
};

export default remainder;
