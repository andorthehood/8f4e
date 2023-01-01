import { i32const } from '../wasmUtils/instructionHelpers';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { WORD_LENGTH } from '../consts';
import { InstructionHandler } from '../types';

const pointerForward: InstructionHandler = function (line, namespace) {
	return { byteCode: [...i32const(WORD_LENGTH), WASMInstruction.I32_ADD], namespace };
};

export default pointerForward;
