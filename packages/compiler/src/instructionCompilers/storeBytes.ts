import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import i32store8 from '../wasmUtils/store/i32store8';
import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `storeBytes`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const storeBytes: InstructionCompiler = withValidation(
	{
		scope: 'module',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		minArguments: 1,
	},
	(line, context) => {
		const arg = line.arguments[0];

		if (arg.type !== ArgumentType.LITERAL || !arg.isInteger || arg.value < 0) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		const count = arg.value;

		if (context.stack.length < count + 1) {
			throw getError(ErrorCode.INSUFFICIENT_OPERANDS, line, context);
		}

		// Collect byte items in stack-pop order (poppedBytes[0] = last pushed byte)
		const poppedBytes = [];
		for (let i = 0; i < count; i++) {
			poppedBytes.push(context.stack.pop()!);
		}
		const addressItem = context.stack.pop()!;

		// Re-push for compileSegment to consume via localSet
		context.stack.push(addressItem);
		for (const b of poppedBytes) {
			context.stack.push(b);
		}

		const tempAddrVar = `__storeBytesAddr_${line.lineNumber}`;
		const tempByteVars = poppedBytes.map((_, i) => `__storeBytesByte${i}_${line.lineNumber}`);

		const ret = compileSegment(
			[
				`local int ${tempAddrVar}`,
				// Declare byte locals
				...poppedBytes.map((_, i) => `local int ${tempByteVars[i]}`),
				// localSet in stack-pop order (poppedBytes[0] is on top of stack)
				...poppedBytes.map((_, i) => `localSet ${tempByteVars[i]}`),
				`localSet ${tempAddrVar}`,
				// Write at offset (count-1-i): poppedBytes[0] (last pushed) → offset N-1,
				// poppedBytes[N-1] (first pushed) → offset 0, preserving push order in memory
				...poppedBytes.flatMap((_, i) => [
					`localGet ${tempAddrVar}`,
					`localGet ${tempByteVars[i]}`,
					...i32store8(undefined, undefined, 0, count - 1 - i).map(b => `wasm ${b}`),
				]),
			],
			context
		);

		// wasm instructions don't update the stack tracking; manually pop the localGet pairs
		for (let i = 0; i < count * 2; i++) {
			context.stack.pop();
		}

		return ret;
	}
);

export default storeBytes;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('storeBytes instruction compiler', () => {
		it('throws MISSING_ARGUMENT when count argument is absent', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false, isSafeMemoryAddress: true });

			expect(() => {
				storeBytes({ lineNumber: 1, instruction: 'storeBytes', arguments: [] } as AST[number], context);
			}).toThrow();
		});

		it('throws MISSING_ARGUMENT for a non-integer count argument', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false, isSafeMemoryAddress: true });

			expect(() => {
				storeBytes(
					{
						lineNumber: 1,
						instruction: 'storeBytes',
						arguments: [{ type: ArgumentType.LITERAL, value: 1.5, isInteger: false }],
					} as AST[number],
					context
				);
			}).toThrow();
		});

		it('throws MISSING_ARGUMENT for a negative count argument', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false, isSafeMemoryAddress: true });

			expect(() => {
				storeBytes(
					{
						lineNumber: 1,
						instruction: 'storeBytes',
						arguments: [{ type: ArgumentType.LITERAL, value: -1, isInteger: true }],
					} as AST[number],
					context
				);
			}).toThrow();
		});

		it('throws INSUFFICIENT_OPERANDS when stack has fewer than count+1 items', () => {
			const context = createInstructionCompilerTestContext();
			// Only 2 items on stack but count=3 requires 4
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

			expect(() => {
				storeBytes(
					{
						lineNumber: 1,
						instruction: 'storeBytes',
						arguments: [{ type: ArgumentType.LITERAL, value: 3, isInteger: true }],
					} as AST[number],
					context
				);
			}).toThrow();
		});

		it('compiles storeBytes 3 and leaves an empty stack', () => {
			const context = createInstructionCompilerTestContext({ memoryByteSize: 256 });
			// address + 3 bytes
			context.stack.push(
				{ isInteger: true, isNonZero: false, isSafeMemoryAddress: true },
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false }
			);

			storeBytes(
				{
					lineNumber: 1,
					instruction: 'storeBytes',
					arguments: [{ type: ArgumentType.LITERAL, value: 3, isInteger: true }],
				} as AST[number],
				context
			);

			expect(context.stack).toHaveLength(0);
		});

		it('emits i32.store8 opcode (0x3a = 58) for each byte', () => {
			const context = createInstructionCompilerTestContext({ memoryByteSize: 256 });
			context.stack.push(
				{ isInteger: true, isNonZero: false, isSafeMemoryAddress: true },
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false }
			);

			storeBytes(
				{
					lineNumber: 1,
					instruction: 'storeBytes',
					arguments: [{ type: ArgumentType.LITERAL, value: 2, isInteger: true }],
				} as AST[number],
				context
			);

			expect(context.byteCode.filter(b => b === 0x3a)).toHaveLength(2);
		});

		it('compiles storeBytes 0 (address-only pop) and leaves an empty stack', () => {
			const context = createInstructionCompilerTestContext({ memoryByteSize: 256 });
			context.stack.push({ isInteger: true, isNonZero: false, isSafeMemoryAddress: true });

			storeBytes(
				{
					lineNumber: 1,
					instruction: 'storeBytes',
					arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
				} as AST[number],
				context
			);

			expect(context.stack).toHaveLength(0);
		});
	});
}
