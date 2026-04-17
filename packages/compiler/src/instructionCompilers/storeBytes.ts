import { i32store8 } from '@8f4e/compiler-wasm-utils';

import { compileSegment } from '../compiler';
import { ErrorCode } from '../compilerError';
import { withValidation } from '../withValidation';

import type { InstructionCompiler, StoreBytesLine } from '../types';

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
