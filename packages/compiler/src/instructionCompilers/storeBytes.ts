import { ArgumentType } from '../types';
import { ErrorCode } from '../errors';
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
		argumentTypes: ['nonNegativeIntegerLiteral'],
		validateOperands: (line) => {
			const count = (line.arguments[0] as Extract<(typeof line.arguments)[number], { type: ArgumentType.LITERAL }>).value;
			return {
				minOperands: count + 1,
				operandTypes: new Array(count + 1).fill('int'),
			};
		},
	},
	(line, context) => {
		const count = (line.arguments[0] as Extract<(typeof line.arguments)[number], { type: ArgumentType.LITERAL }>).value;

		const tempAddrVar = `__storeBytesAddr_${line.lineNumber}`;
		const tempByteVar = `__storeBytesByte_${line.lineNumber}`;

		const lines = [`local int ${tempAddrVar}`, `local int ${tempByteVar}`, `localSet ${tempAddrVar}`];
		for (let i = 0; i < count; i++) {
			lines.push(
				`localSet ${tempByteVar}`,
				`localGet ${tempAddrVar}`,
				`localGet ${tempByteVar}`,
				...i32store8(undefined, undefined, 0, i).map(b => `wasm ${b}`)
			);
		}

		compileSegment(lines, context);

		// `wasm` opcodes do not update stack tracking. Each i32.store8 consumes addr+byte.
		for (let i = 0; i < count * 2; i++) {
			context.stack.pop();
		}

		return context;
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

		it('throws TYPE_MISMATCH for a non-integer count argument', () => {
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
			}).toThrow(`${ErrorCode.TYPE_MISMATCH}`);
		});

		it('throws EXPECTED_VALUE for a negative count argument', () => {
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
			}).toThrow(`${ErrorCode.EXPECTED_VALUE}`);
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
			// bytes pushed first, addr pushed last (on top)
			context.stack.push(
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false, isSafeMemoryAddress: true }
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
			// bytes pushed first, addr pushed last (on top)
			context.stack.push(
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false, isSafeMemoryAddress: true }
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
