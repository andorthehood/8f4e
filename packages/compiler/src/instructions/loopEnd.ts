import { br } from '../wasmUtils/instructionHelpers';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const loopEnd: InstructionHandler = function (line, namespace, stack) {
	return { byteCode: [...br(0), WASMInstruction.END], namespace, stack };
};

export default loopEnd;
