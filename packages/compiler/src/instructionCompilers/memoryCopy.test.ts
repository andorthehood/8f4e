import { describe, expect, it } from 'vitest';
import { ArgumentType } from '@8f4e/compiler-spec';
import { WASM_MEMORY_SIZE, WASM_MISC_MEMORY_COPY } from '@8f4e/compiler-wasm-utils';

import memoryCopy from './memoryCopy';

import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST } from '@8f4e/compiler-spec';

const line = {
	lineNumberBeforeMacroExpansion: 1,
	lineNumberAfterMacroExpansion: 1,
	instruction: 'memoryCopy',
	arguments: [{ type: ArgumentType.LITERAL, value: 20, isInteger: true }],
} as AST[number];

describe('memoryCopy instruction compiler', () => {
	it('emits raw memory.copy when destination, source, and length are proven safe', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{
				isInteger: true,
				isNonZero: false,
				address: {
					safeRange: { source: 'memory-start', byteAddress: 20, safeByteLength: 20, memoryId: 'target' },
				},
			},
			{
				isInteger: true,
				isNonZero: false,
				address: {
					safeRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 20, memoryId: 'source' },
				},
			}
		);

		memoryCopy(line, context);

		expect(context.stack).toHaveLength(0);
		expect(context.byteCode).toStrictEqual([0x41, 0x14, 0xfc, WASM_MISC_MEMORY_COPY, 0x00, 0x00]);
	});

	it('guards the copy when the length is not proven at compile time', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		memoryCopy(line, context);

		expect(context.byteCode).toContain(WASM_MEMORY_SIZE);
		expect(context.byteCode).toContain(WASM_MISC_MEMORY_COPY);
		expect(context.stack).toHaveLength(0);
	});

	it('compiles memoryCopy 0 as a stack-only no-op', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

		memoryCopy(
			{
				...line,
				arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
			} as AST[number],
			context
		);

		expect(context.byteCode).toStrictEqual([]);
		expect(context.stack).toHaveLength(0);
	});
});
