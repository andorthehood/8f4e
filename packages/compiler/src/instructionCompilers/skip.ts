import { withValidation } from '../withValidation';
import { ArgumentType, BLOCK_TYPE, MemoryTypes } from '../types';
import i32const from '../wasmUtils/const/i32const';
import br from '../wasmUtils/controlFlow/br';
import i32load from '../wasmUtils/load/i32load';
import i32store from '../wasmUtils/store/i32store';
import { calculateWordAlignedSizeOfMemory, saveByteCode } from '../utils/compilation';
import Type from '../wasmUtils/type';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { resolveConstantValueOrExpressionOrThrow } from '../utils/resolveConstantValue';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `skip`.
 * @see [Instruction docs](../../docs/instructions/control-flow.md)
 */
const skip: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
	},
	(line, context) => {
		let timesToSkip = 0;

		if (!line.arguments[0]) {
			return saveByteCode(context, [WASMInstruction.RETURN]);
		}

		if (line.arguments[0].type === ArgumentType.LITERAL) {
			timesToSkip = line.arguments[0].value;
		} else {
			timesToSkip = resolveConstantValueOrExpressionOrThrow(line.arguments[0].value, line, context).value;
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
			isUnsigned: false,
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

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('skip instruction compiler', () => {
		it('returns early without arguments', () => {
			const context = createInstructionCompilerTestContext();

			skip({ lineNumber: 1, instruction: 'skip', arguments: [] } as AST[number], context);

			expect({
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('allocates a sleeper counter with literal argument', () => {
			const context = createInstructionCompilerTestContext();

			skip(
				{
					lineNumber: 2,
					instruction: 'skip',
					arguments: [{ type: ArgumentType.LITERAL, value: 3, isInteger: true }],
				} as AST[number],
				context
			);

			expect({
				blockStack: context.blockStack,
				memory: context.namespace.memory,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});
	});
}
