import { describe, expect, it } from 'vitest';
import { ArgumentType } from '@8f4e/compiler-types';
import { WASMInstruction } from '@8f4e/compiler-wasm-utils';

import { clampAddress, clampGlobalAddress, clampModuleAddress } from './clampAddress';

import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import { ErrorCode } from '../compilerError';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, MemoryAddressRange } from '@8f4e/compiler-types';

const range: MemoryAddressRange = {
	source: 'memory-start',
	byteAddress: 0,
	safeByteLength: 128,
	memoryId: 'arr',
};

function createLine(
	instruction: 'clampAddress' | 'clampModuleAddress' | 'clampGlobalAddress',
	accessByteWidth?: number
) {
	return {
		lineNumberBeforeMacroExpansion: 1,
		lineNumberAfterMacroExpansion: 1,
		instruction,
		arguments:
			accessByteWidth === undefined ? [] : [{ type: ArgumentType.LITERAL, value: accessByteWidth, isInteger: true }],
	} as AST[number];
}

describe('clamp address instruction compilers', () => {
	it('clamps to tracked address range metadata using the global alignment boundary by default', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			isInteger: true,
			isNonZero: true,
			knownIntegerValue: 1024,
			clampAddressRange: range,
		});

		clampAddress(createLine('clampAddress'), context);

		expect(context.stack).toEqual([
			{
				isInteger: true,
				isNonZero: true,
				knownIntegerValue: 128 - GLOBAL_ALIGNMENT_BOUNDARY,
				clampAddressRange: range,
				safeMemoryAccessByteWidth: GLOBAL_ALIGNMENT_BOUNDARY,
			},
		]);
		expect(context.byteCode).toContain(WASMInstruction.SELECT);
		expect(context.byteCode).not.toContain(WASMInstruction.MEMORY_SIZE);
	});

	it('uses the optional access width when clamping to tracked address range metadata', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			isInteger: true,
			isNonZero: true,
			knownIntegerValue: 1024,
			clampAddressRange: range,
		});

		clampAddress(createLine('clampAddress', 1), context);

		expect(context.stack).toEqual([
			{
				isInteger: true,
				isNonZero: true,
				knownIntegerValue: 127,
				clampAddressRange: range,
				safeMemoryAccessByteWidth: 1,
			},
		]);
	});

	it('throws when clampAddress has no address range metadata', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false });

		expect(() => clampAddress(createLine('clampAddress'), context)).toThrow(
			expect.objectContaining({ code: ErrorCode.ADDRESS_RANGE_REQUIRED })
		);
	});

	it('clamps to the current module range', () => {
		const context = createInstructionCompilerTestContext({
			startingByteAddress: 64,
			currentModuleWordAlignedSize: 8,
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				moduleName: 'osc',
			},
		});
		context.stack.push({ isInteger: true, isNonZero: true, knownIntegerValue: 999 });

		clampModuleAddress(createLine('clampModuleAddress'), context);

		expect(context.stack).toEqual([
			{
				isInteger: true,
				isNonZero: true,
				knownIntegerValue: 92,
				clampAddressRange: {
					source: 'module-start',
					byteAddress: 64,
					safeByteLength: 32,
					moduleId: 'osc',
				},
				safeMemoryAccessByteWidth: GLOBAL_ALIGNMENT_BOUNDARY,
			},
		]);
		expect(context.byteCode).toContain(WASMInstruction.SELECT);
		expect(context.byteCode).not.toContain(WASMInstruction.MEMORY_SIZE);
	});

	it('clamps to the full global memory range', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: true, knownIntegerValue: 1024 });

		clampGlobalAddress(createLine('clampGlobalAddress'), context);

		expect(context.stack).toEqual([
			{
				isInteger: true,
				isNonZero: false,
				safeMemoryAccessByteWidth: GLOBAL_ALIGNMENT_BOUNDARY,
			},
		]);
		expect(context.byteCode).toContain(WASMInstruction.MEMORY_SIZE);
		expect(context.byteCode).toContain(WASMInstruction.SELECT);
	});

	it('rejects zero access width', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false, clampAddressRange: range });

		expect(() => clampAddress(createLine('clampAddress', 0), context)).toThrow(
			expect.objectContaining({ code: ErrorCode.INVALID_ACCESS_WIDTH })
		);
	});

	it('rejects unsupported access widths', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ isInteger: true, isNonZero: false, clampAddressRange: range });

		expect(() => clampAddress(createLine('clampAddress', 3), context)).toThrow(
			expect.objectContaining({ code: ErrorCode.INVALID_ACCESS_WIDTH })
		);
	});

	it('rejects access widths larger than the tracked range', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			isInteger: true,
			isNonZero: false,
			clampAddressRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 2, memoryId: 'tiny' },
		});

		expect(() => clampAddress(createLine('clampAddress'), context)).toThrow(
			expect.objectContaining({ code: ErrorCode.ADDRESS_RANGE_TOO_SMALL })
		);
	});
});
