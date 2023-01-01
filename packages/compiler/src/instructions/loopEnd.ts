import { br } from '../wasmUtils/instructionHelpers';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const loopEnd: InstructionHandler = function (line, namespace) {
	return { byteCode: [...br(0), WASMInstruction.END], namespace };
};

export default loopEnd;
