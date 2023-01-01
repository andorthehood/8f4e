import { br } from '../wasmUtils/instructionHelpers';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const loopEnd: InstructionHandler = function () {
	return [...br(0), WASMInstruction.END];
};

export default loopEnd;
