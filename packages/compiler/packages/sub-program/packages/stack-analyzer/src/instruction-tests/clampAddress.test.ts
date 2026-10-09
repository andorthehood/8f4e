import type { CompilerASTLine, MemoryAddressRange, PlannedMemoryModule } from '@8f4e/language-spec';
import { ArgumentType, ErrorCode, GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { analyzeInstruction } from '../analyzeInstruction';
import createStackAnalyzerTestContext from '../testUtils';

const range: MemoryAddressRange = {
	source: 'memory-start',
	memoryIndex: 0,
	byteAddress: 0,
	safeByteLength: 128,
	memoryId: 'arr',
};

function createPlannedModule(overrides: Partial<PlannedMemoryModule> = {}): PlannedMemoryModule {
	const byteAddress = overrides.byteAddress ?? 0;
	const wordAlignedSize = overrides.wordAlignedSize ?? 0;
	return {
		id: overrides.id ?? 'test',
		lineNumber: overrides.lineNumber ?? 0,
		byteAddress,
		wordAlignedSize,
		wordAlignedByteLength: wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY,
		endByteAddress: wordAlignedSize > 0 ? byteAddress + (wordAlignedSize - 1) * GLOBAL_ALIGNMENT_BOUNDARY : byteAddress,
		endAddressSafeByteLength: wordAlignedSize > 0 ? GLOBAL_ALIGNMENT_BOUNDARY : 0,
		memory: overrides.memory ?? {},
		declarations: overrides.declarations ?? [],
		declarationSources: overrides.declarationSources ?? [],
		memoryIndex: overrides.memoryIndex ?? 0,
		...(overrides.memoryRegionName ? { memoryRegionName: overrides.memoryRegionName } : {}),
	};
}

function createLine(
	instruction: 'clampAddress' | 'clampModuleAddress' | 'clampGlobalAddress',
	accessByteWidth?: number
) {
	return {
		lineNumber: 1,
		instruction,
		arguments:
			accessByteWidth === undefined ? [] : [{ type: ArgumentType.LITERAL, value: accessByteWidth, isInteger: true }],
	} as CompilerASTLine;
}
describe('clampAddress stack analysis', () => {
	it('clamps to tracked address range metadata using the global alignment boundary by default', () => {
		const context = createStackAnalyzerTestContext();
		context.stack.push({
			kind: 'address',
			valueType: 'int',
			isNonZero: true,
			knownValue: 1024,
			address: { memoryIndex: 0, clampRange: range },
		});

		analyzeInstruction(createLine('clampAddress'), context);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: true,
				knownValue: 128 - GLOBAL_ALIGNMENT_BOUNDARY,
				address: {
					memoryIndex: 0,
					clampRange: range,
					safeAccessByteWidth: GLOBAL_ALIGNMENT_BOUNDARY,
				},
			},
		]);
	});

	it('uses the optional access width when clamping to tracked address range metadata', () => {
		const context = createStackAnalyzerTestContext();
		context.stack.push({
			kind: 'address',
			valueType: 'int',
			isNonZero: true,
			knownValue: 1024,
			address: { memoryIndex: 0, clampRange: range },
		});

		analyzeInstruction(createLine('clampAddress', 1), context);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: true,
				knownValue: 127,
				address: {
					memoryIndex: 0,
					clampRange: range,
					safeAccessByteWidth: 1,
				},
			},
		]);
	});

	it('clamps known negative addresses to the lower range bound', () => {
		const context = createStackAnalyzerTestContext();
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
			knownValue: -1,
			address: { memoryIndex: 0, clampRange: shiftedRange },
		});

		analyzeInstruction(createLine('clampAddress'), context);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: true,
				knownValue: 64,
				address: {
					memoryIndex: 0,
					clampRange: shiftedRange,
					safeAccessByteWidth: GLOBAL_ALIGNMENT_BOUNDARY,
				},
			},
		]);
	});

	it('throws when clampAddress has no address range metadata', () => {
		const context = createStackAnalyzerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: false });

		expect(() => analyzeInstruction(createLine('clampAddress'), context)).toThrow(
			expect.objectContaining({ code: ErrorCode.ADDRESS_RANGE_REQUIRED })
		);
	});

	it('clamps to the current module range', () => {
		const plannedModule = createPlannedModule({
			id: 'osc',
			byteAddress: 64,
			wordAlignedSize: 8,
		});
		const context = createStackAnalyzerTestContext({
			startingByteAddress: 64,
			currentModuleWordAlignedSize: 8,
			currentPlannedModule: plannedModule,
			namespace: {
				...createStackAnalyzerTestContext().namespace,
				moduleName: 'osc',
			},
		});
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: true, knownValue: 999 });

		analyzeInstruction(createLine('clampModuleAddress'), context);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: true,
				knownValue: 92,
				address: {
					memoryIndex: 0,
					clampRange: {
						source: 'module-start',
						memoryIndex: 0,
						byteAddress: 64,
						safeByteLength: 32,
						moduleId: 'osc',
					},
					safeAccessByteWidth: GLOBAL_ALIGNMENT_BOUNDARY,
				},
			},
		]);
	});

	it('clamps to the full global memory range', () => {
		const context = createStackAnalyzerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: true, knownValue: 1024 });

		analyzeInstruction(createLine('clampGlobalAddress'), context);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: false,
				address: {
					memoryIndex: 0,
					safeAccessByteWidth: GLOBAL_ALIGNMENT_BOUNDARY,
				},
			},
		]);
	});

	it('rejects access widths larger than the tracked range', () => {
		const context = createStackAnalyzerTestContext();
		context.stack.push({
			kind: 'address',
			valueType: 'int',
			isNonZero: false,
			address: {
				memoryIndex: 0,
				clampRange: { memoryIndex: 0, source: 'memory-start', byteAddress: 0, safeByteLength: 2, memoryId: 'tiny' },
			},
		});

		expect(() => analyzeInstruction(createLine('clampAddress'), context)).toThrow(
			expect.objectContaining({ code: ErrorCode.ADDRESS_RANGE_TOO_SMALL })
		);
	});
});
