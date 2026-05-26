import { describe, expect, it } from 'vitest';
import { ArgumentType } from '@8f4e/compiler-spec';
import { WASM_MEMORY_SIZE } from '@8f4e/compiler-wasm-utils';

import storeBytes from './storeBytes';

import { validateInstruction } from '../stackAnalysis/validateInstruction';
import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { CompilerASTLine } from '@8f4e/compiler-spec';

describe('storeBytes instruction compiler', () => {
	it('throws INSUFFICIENT_OPERANDS when stack has fewer than count+1 items', () => {
		const context = createInstructionCompilerTestContext();
		// Only 2 items on stack but count=3 requires 4
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false }
		);
		const line = {
			lineNumberBeforeMacroExpansion: 1,
			lineNumberAfterMacroExpansion: 1,
			instruction: 'storeBytes',
			arguments: [{ type: ArgumentType.LITERAL, value: 3, isInteger: true }],
		} as CompilerASTLine;

		expect(() => {
			validateInstruction(line, context);
		}).toThrow();
	});

	it('compiles storeBytes 3 and leaves an empty stack', () => {
		const context = createInstructionCompilerTestContext();
		// bytes pushed first, addr pushed last (on top)
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{
				kind: 'value',
				valueType: 'int',
				isNonZero: false,
				address: {
					safeRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 3, memoryId: 'test' },
				},
			}
		);

		analyzeAndCompileInstruction(
			storeBytes,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'storeBytes',
				arguments: [{ type: ArgumentType.LITERAL, value: 3, isInteger: true }],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toHaveLength(0);
	});

	it('emits i32.store8 opcode (0x3a = 58) for each byte', () => {
		const context = createInstructionCompilerTestContext();
		// bytes pushed first, addr pushed last (on top)
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{
				kind: 'value',
				valueType: 'int',
				isNonZero: false,
				address: {
					safeRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 2, memoryId: 'test' },
				},
			}
		);

		analyzeAndCompileInstruction(
			storeBytes,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'storeBytes',
				arguments: [{ type: ArgumentType.LITERAL, value: 2, isInteger: true }],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode.filter(b => b === 0x3a)).toHaveLength(2);
	});

	it('guards byte stores when address metadata is shorter than the byte count', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push(
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{ kind: 'value', valueType: 'int', isNonZero: false },
			{
				kind: 'value',
				valueType: 'int',
				isNonZero: false,
				address: {
					safeRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 1, memoryId: 'test' },
				},
			}
		);

		analyzeAndCompileInstruction(
			storeBytes,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'storeBytes',
				arguments: [{ type: ArgumentType.LITERAL, value: 2, isInteger: true }],
			} as CompilerASTLine,
			context
		);

		expect(context.byteCode).toContain(WASM_MEMORY_SIZE);
		expect(context.stack).toHaveLength(0);
	});

	it('compiles storeBytes 0 (address-only pop) and leaves an empty stack', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			kind: 'value',
			valueType: 'int',
			isNonZero: false,
			address: {
				safeRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 0, memoryId: 'test' },
			},
		});

		analyzeAndCompileInstruction(
			storeBytes,
			{
				lineNumberBeforeMacroExpansion: 1,
				lineNumberAfterMacroExpansion: 1,
				instruction: 'storeBytes',
				arguments: [{ type: ArgumentType.LITERAL, value: 0, isInteger: true }],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toHaveLength(0);
	});
});
