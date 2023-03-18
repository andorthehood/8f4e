import { br } from '../wasmUtils/instructionHelpers';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { InstructionHandler } from '../types';

const loopEnd: InstructionHandler = function (line, namespace, stack, blockStack) {
	return { byteCode: [...br(0), WASMInstruction.END], namespace, stack, blockStack };
};

export default loopEnd;
