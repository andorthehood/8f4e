import { WASM_MEMORY_SIZE, WASM_MISC_MEMORY_COPY } from '@8f4e/compiler-wasm-utils';
import type { CompilerASTLine } from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';

import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import memoryCopy from './memoryCopy';

const line = {
	lineNumber: 1,
	instruction: 'memoryCopy',
	arguments: [{ type: ArgumentType.LITERAL, value: 20, isInteger: true }],
} as CompilerASTLine;

describe('memoryCopy instruction compiler', () => {
	it('emits raw memory.copy when destination, source, and length are proven safe', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: false,
				address: {
					memoryIndex: 0,
					safeRange: {
						source: 'memory-start',
						memoryIndex: 0,
						byteAddress: 20,
						safeByteLength: 20,
						memoryId: 'target',
					},
				},
			},
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: false,
				address: {
					memoryIndex: 0,
					safeRange: {
						source: 'memory-start',
						memoryIndex: 0,
						byteAddress: 0,
						safeByteLength: 20,
						memoryId: 'source',
					},
				},
			}
		);

		analyzeAndCompileInstruction(memoryCopy, line, context);

		expect(context.stack).toHaveLength(0);
		expect(context.byteCode).toStrictEqual([0x41, 0x14, 0xfc, WASM_MISC_MEMORY_COPY, 0x00, 0x00]);
	});

	it('guards the copy when the length is not proven at compile time', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);

		analyzeAndCompileInstruction(memoryCopy, line, context);

		expect(context.byteCode).toContain(WASM_MEMORY_SIZE);
		expect(context.byteCode).toContain(WASM_MISC_MEMORY_COPY);
		expect(context.stack).toHaveLength(0);
	});

	it('compiles memoryCopy 0 as a stack-only no-op', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);

		analyzeAndCompileInstruction(
			memoryCopy,
			{
				...line,
				arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).toStrictEqual([]);
		expect(context.stack).toHaveLength(0);
	});
});
