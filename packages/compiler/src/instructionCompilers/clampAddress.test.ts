import { describe, expect, it } from 'vitest';
import { ArgumentType, ErrorCode, ALLOCATION_UNIT_BYTE_SIZE } from '@8f4e/compiler-spec';
import { WASM_I32_LT_S, WASM_I32_LT_U, WASM_MEMORY_SIZE, WASM_SELECT } from '@8f4e/compiler-wasm-utils';

import { clampAddress, clampGlobalAddress, clampModuleAddress } from './clampAddress';

import normalizeClampAddress from '../semantic/normalization/clampAddress';
import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';

import type { CompilerASTLine, MemoryAddressRange } from '@8f4e/compiler-spec';

const range: MemoryAddressRange = {
	source: 'memory-start',
	memoryIndex: 0,
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
	} as CompilerASTLine;
}

describe('clamp address instruction compilers', () => {
	it('clamps to tracked address range metadata using the global alignment boundary by default', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			kind: 'address',
			valueType: 'int',
			isNonZero: true,
			knownIntegerValue: 1024,
			address: { clampRange: range },
		});

		analyzeAndCompileInstruction(clampAddress, createLine('clampAddress'), context);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: true,
				knownIntegerValue: 128 - ALLOCATION_UNIT_BYTE_SIZE,
				address: {
					memoryIndex: 0,
					clampRange: range,
					safeAccessByteWidth: ALLOCATION_UNIT_BYTE_SIZE,
				},
			},
		]);
		expect(context.byteCode).toContain(WASM_SELECT);
		expect(context.byteCode).not.toContain(WASM_MEMORY_SIZE);
	});

	it('uses the optional access width when clamping to tracked address range metadata', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			kind: 'address',
			valueType: 'int',
			isNonZero: true,
			knownIntegerValue: 1024,
			address: { clampRange: range },
		});

		analyzeAndCompileInstruction(clampAddress, createLine('clampAddress', 1), context);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: true,
				knownIntegerValue: 127,
				address: {
					memoryIndex: 0,
					clampRange: range,
					safeAccessByteWidth: 1,
				},
			},
		]);
	});

	it('clamps known negative addresses to the lower range bound', () => {
		const context = createInstructionCompilerTestContext();
		const shiftedRange: MemoryAddressRange = {
			source: 'memory-start',
			memoryIndex: 0,
			byteAddress: 64,
			safeByteLength: 128,
			memoryId: 'arr',
		};
		context.stack.push({
			kind: 'address',
			valueType: 'int',
			isNonZero: true,
			knownIntegerValue: -1,
			address: { clampRange: shiftedRange },
		});

		analyzeAndCompileInstruction(clampAddress, createLine('clampAddress'), context);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: true,
				knownIntegerValue: 64,
				address: {
					memoryIndex: 0,
					clampRange: shiftedRange,
					safeAccessByteWidth: ALLOCATION_UNIT_BYTE_SIZE,
				},
			},
		]);
		expect(context.byteCode).toContain(WASM_I32_LT_S);
		expect(context.byteCode).not.toContain(WASM_I32_LT_U);
	});

	it('throws when clampAddress has no address range metadata', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		expect(() => analyzeAndCompileInstruction(clampAddress, createLine('clampAddress'), context)).toThrow(
			expect.objectContaining({ code: ErrorCode.ADDRESS_RANGE_REQUIRED })
		);
	});

	it('clamps to the current module range', () => {
		const context = createInstructionCompilerTestContext({
			startingByteAddress: 64,
			currentModuleAllocationUnitCount: 8,
			namespace: {
				...createInstructionCompilerTestContext().namespace,
				moduleName: 'osc',
			},
		});
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 999 });

		analyzeAndCompileInstruction(clampModuleAddress, createLine('clampModuleAddress'), context);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: true,
				knownIntegerValue: 92,
				address: {
					memoryIndex: 0,
					clampRange: {
						source: 'module-start',
						memoryIndex: 0,
						byteAddress: 64,
						safeByteLength: 32,
						moduleId: 'osc',
					},
					safeAccessByteWidth: ALLOCATION_UNIT_BYTE_SIZE,
				},
			},
		]);
		expect(context.byteCode).toContain(WASM_SELECT);
		expect(context.byteCode).not.toContain(WASM_MEMORY_SIZE);
	});

	it('clamps to the full global memory range', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 1024 });

		analyzeAndCompileInstruction(clampGlobalAddress, createLine('clampGlobalAddress'), context);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: false,
				address: {
					memoryIndex: 0,
					safeAccessByteWidth: ALLOCATION_UNIT_BYTE_SIZE,
				},
			},
		]);
		expect(context.byteCode).toContain(WASM_MEMORY_SIZE);
		expect(context.byteCode).toContain(WASM_SELECT);
	});

	it('rejects zero access width', () => {
		const context = createInstructionCompilerTestContext();

		expect(() => normalizeClampAddress(createLine('clampAddress', 0), context)).toThrow(
			expect.objectContaining({ code: ErrorCode.INVALID_ACCESS_WIDTH })
		);
	});

	it('rejects unsupported access widths', () => {
		const context = createInstructionCompilerTestContext();

		expect(() => normalizeClampAddress(createLine('clampAddress', 3), context)).toThrow(
			expect.objectContaining({ code: ErrorCode.INVALID_ACCESS_WIDTH })
		);
	});

	it('rejects access widths larger than the tracked range', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			kind: 'address',
			valueType: 'int',
			isNonZero: false,
			address: {
				clampRange: { source: 'memory-start', byteAddress: 0, safeByteLength: 2, memoryId: 'tiny' },
			},
		});

		expect(() => analyzeAndCompileInstruction(clampAddress, createLine('clampAddress'), context)).toThrow(
			expect.objectContaining({ code: ErrorCode.ADDRESS_RANGE_TOO_SMALL })
		);
	});
});
