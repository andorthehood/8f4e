import type { CompilerASTLine } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { analyzeInstruction } from '../analyzeInstruction';
import createStackAnalyzerTestContext from '../testUtils';

describe('sub stack analysis', () => {
	it('keeps address metadata when subtracting a known negative in-range byte offset', () => {
		const context = createStackAnalyzerTestContext();
		context.stack.push(
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: false,
				knownValue: 0,
				address: {
					memoryIndex: 0,
					safeRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
				},
			},
			{ kind: 'value', valueType: 'int', isNonZero: true, knownValue: -4 }
		);

		analyzeInstruction(
			{
				lineNumber: 1,
				instruction: 'sub',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: true,
				knownValue: 4,
				address: {
					memoryIndex: 0,
					safeRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 4, safeByteLength: 124, memoryId: 'arr' },
					clampRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
				},
			},
		]);
	});

	it('drops address metadata when subtracting a known positive offset from a start-range address', () => {
		const context = createStackAnalyzerTestContext();
		context.stack.push(
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: false,
				knownValue: 0,
				address: {
					memoryIndex: 0,
					safeRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
				},
			},
			{ kind: 'value', valueType: 'int', isNonZero: true, knownValue: 4 }
		);

		analyzeInstruction(
			{
				lineNumber: 1,
				instruction: 'sub',
				arguments: [],
			} as CompilerASTLine,
			context
		);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				isNonZero: true,
				knownValue: -4,
				address: {
					memoryIndex: 0,
					clampRange: { source: 'memory-start', memoryIndex: 0, byteAddress: 0, safeByteLength: 128, memoryId: 'arr' },
				},
			},
		]);
	});
});
