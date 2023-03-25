import { br } from '../wasmUtils/instructionHelpers';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const loopEnd: InstructionHandler = function (line, context) {
	return { byteCode: [...br(0), WASMInstruction.END], context };
};

export default loopEnd;
