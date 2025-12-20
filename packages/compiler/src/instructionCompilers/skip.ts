import { withValidation } from '../withValidation';
import { ArgumentType, BLOCK_TYPE, MemoryTypes } from '../types';
import { ErrorCode, getError } from '../errors';
import { br, i32const, i32load, i32store } from '../wasmUtils/instructionHelpers';
import { calculateWordAlignedSizeOfMemory, saveByteCode } from '../utils';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';

import type { InstructionCompiler } from '../types';

const skip: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		const { consts } = context.namespace;

		let timesToSkip = 0;

		if (!line.arguments[0]) {
			return saveByteCode(context, [WASMInstruction.RETURN]);
		}

		if (line.arguments[0].type === ArgumentType.LITERAL) {
			timesToSkip = line.arguments[0].value;
		} else {
			if (typeof consts[line.arguments[0].value] !== 'undefined') {
				timesToSkip = consts[line.arguments[0].value].value;
			} else {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}
		}

		const memory = context.namespace.memory;
		const wordAlignedAddress = calculateWordAlignedSizeOfMemory(memory);
		const byteAddress = context.startingByteAddress + wordAlignedAddress * GLOBAL_ALIGNMENT_BOUNDARY;

		memory['__sleeper' + wordAlignedAddress] = {
			numberOfElements: 1,
			wordAlignedAddress: context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + wordAlignedAddress,
			wordAlignedSize: 1,
			elementWordSize: 4,
			byteAddress,
			id: '__sleeper' + wordAlignedAddress,
			default: 0,
			type: MemoryTypes.int,
			isPointer: false,
			isPointingToInteger: false,
			isPointingToPointer: false,
			isInteger: true,
		};

		context.blockStack.push({
			expectedResultIsInteger: false,
			hasExpectedResult: false,
			blockType: BLOCK_TYPE.BLOCK,
		});

		return saveByteCode(context, [
			WASMInstruction.BLOCK,
			Type.VOID,
			// Increment counter
			...i32const(byteAddress),
			...i32const(byteAddress),
			...i32load(),
			...i32const(1),
			WASMInstruction.I32_ADD,
			...i32store(),
			// Return if the value of the counter is smaller than
			// the number specified in the argument
			...i32const(byteAddress),
			...i32load(),
			...i32const(timesToSkip),
			WASMInstruction.I32_LT_S,
			WASMInstruction.IF,
			Type.VOID,
			// WASMInstruction.RETURN,
			...br(1),
			WASMInstruction.ELSE,
			...i32const(byteAddress),
			...i32const(0),
			...i32store(),
			WASMInstruction.END,
		]);
	}
);

export default skip;
