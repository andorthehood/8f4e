import { i32store8 } from '@8f4e/compiler-wasm-utils';

import { ArgumentType } from '../types';
import { ErrorCode } from '../compilerError';
import { compileSegment } from '../compiler';
import { withValidation } from '../withValidation';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler, StoreBytesLine } from '../types';

/**
 * Instruction compiler for `storeBytes`.
 * @see [Instruction docs](../../docs/instructions/memory.md)
 */
const storeBytes: InstructionCompiler<StoreBytesLine> = withValidation<StoreBytesLine>(
	{
		scope: 'module',
		onInvalidScope: ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK,
		validateOperands: (line: StoreBytesLine) => {
			const count = line.arguments[0].value;
			return {
				minOperands: count + 1,
				operandTypes: new Array(count + 1).fill('int'),
			};
		},
	},
	(line: StoreBytesLine, context) => {
		const count = line.arguments[0].value;

		const lineNumberAfterMacroExpansion = line.lineNumberAfterMacroExpansion;
		const tempAddrVar = `__storeBytesAddr_${lineNumberAfterMacroExpansion}`;
		const tempByteVar = `__storeBytesByte_${lineNumberAfterMacroExpansion}`;

		const lines = [`local int ${tempAddrVar}`, `local int ${tempByteVar}`, `localSet ${tempAddrVar}`];
		for (let i = 0; i < count; i++) {
			lines.push(
				`localSet ${tempByteVar}`,
				`push ${tempAddrVar}`,
				`push ${tempByteVar}`,
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
		it('throws INSUFFICIENT_OPERANDS when stack has fewer than count+1 items', () => {
			const context = createInstructionCompilerTestContext();
			// Only 2 items on stack but count=3 requires 4
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

			expect(() => {
				storeBytes(
					{
						lineNumberBeforeMacroExpansion: 1,
						lineNumberAfterMacroExpansion: 1,
						instruction: 'storeBytes',
						arguments: [{ type: ArgumentType.LITERAL, value: 3, isInteger: true }],
					} as AST[number],
					context
				);
			}).toThrow();
		});

		it('compiles storeBytes 3 and leaves an empty stack', () => {
			const context = createInstructionCompilerTestContext();
			// bytes pushed first, addr pushed last (on top)
			context.stack.push(
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false, isSafeMemoryAddress: true }
			);

			storeBytes(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'storeBytes',
					arguments: [{ type: ArgumentType.LITERAL, value: 3, isInteger: true }],
				} as AST[number],
				context
			);

			expect(context.stack).toHaveLength(0);
		});

		it('emits i32.store8 opcode (0x3a = 58) for each byte', () => {
			const context = createInstructionCompilerTestContext();
			// bytes pushed first, addr pushed last (on top)
			context.stack.push(
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false },
				{ isInteger: true, isNonZero: false, isSafeMemoryAddress: true }
			);

			storeBytes(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'storeBytes',
					arguments: [{ type: ArgumentType.LITERAL, value: 2, isInteger: true }],
				} as AST[number],
				context
			);

			expect(context.byteCode.filter(b => b === 0x3a)).toHaveLength(2);
		});

		it('compiles storeBytes 0 (address-only pop) and leaves an empty stack', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false, isSafeMemoryAddress: true });

			storeBytes(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'storeBytes',
					arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
				} as AST[number],
				context
			);

			expect(context.stack).toHaveLength(0);
		});
	});
}
