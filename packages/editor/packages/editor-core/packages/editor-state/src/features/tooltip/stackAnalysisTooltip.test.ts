import { describe, expect, it } from 'vitest';

import { getStackAnalysisTooltipContent, getStackAnalysisTooltipText } from './stackAnalysisTooltip';

describe('stack analysis tooltip text', () => {
	it('formats selected line stack analysis', () => {
		const stackAnalysisLine = {
			lineNumber: 2,
			instruction: 'add',
			stackAnalysis: {
				stackBefore: [
					{ kind: 'value', valueType: 'int', knownValue: 0 },
					{ kind: 'value', valueType: 'int', knownValue: 1 },
					{ kind: 'value', valueType: 'int', knownValue: 2 },
				],
				consumedOperands: [
					{ kind: 'value', valueType: 'int', knownValue: 1 },
					{ kind: 'value', valueType: 'int', knownValue: 2 },
				],
				producedStackItems: [{ kind: 'value', valueType: 'int' }],
				stackAfter: [
					{ kind: 'value', valueType: 'int', knownValue: 0 },
					{ kind: 'value', valueType: 'int' },
				],
			},
		} as const;

		expect(getStackAnalysisTooltipText(stackAnalysisLine)).toEqual([
			'before [int=0, -int=1, -int=2]',
			'after: [int=0, +int]',
		]);
		expect(getStackAnalysisTooltipContent(stackAnalysisLine).highlightTargets).toEqual([
			{ lineIndex: 0, column: 15, widthChars: 6, fillColor: 'tooltipConsumedHighlight' },
			{ lineIndex: 0, column: 23, widthChars: 6, fillColor: 'tooltipConsumedHighlight' },
			{ lineIndex: 1, column: 15, widthChars: 4, fillColor: 'tooltipAddedHighlight' },
		]);
	});

	it('formats known float32 and float64 values', () => {
		const stackAnalysisLine = {
			lineNumber: 1,
			instruction: 'push',
			stackAnalysis: {
				stackBefore: [],
				consumedOperands: [],
				producedStackItems: [
					{ kind: 'value', valueType: 'float', knownValue: 3.5 },
					{ kind: 'value', valueType: 'float64', knownValue: Math.PI },
				],
				stackAfter: [
					{ kind: 'value', valueType: 'float', knownValue: 3.5 },
					{ kind: 'value', valueType: 'float64', knownValue: Math.PI },
				],
			},
		} as const;

		expect(getStackAnalysisTooltipText(stackAnalysisLine)).toEqual([
			'before []',
			`after: [+float=3.5, +float64=${Math.PI}]`,
		]);
	});

	it('formats long stack analysis as multiline blocks', () => {
		const stackAnalysisLine = {
			lineNumber: 6,
			instruction: 'drop',
			stackAnalysis: {
				stackBefore: [
					{ kind: 'value', valueType: 'int' },
					{ kind: 'value', valueType: 'int', knownValue: 1234 },
					{ kind: 'value', valueType: 'float' },
					{ kind: 'address', valueType: 'int', address: { memoryIndex: 0 } },
					{ kind: 'value', valueType: 'int' },
					{ kind: 'value', valueType: 'int' },
				],
				consumedOperands: [{ kind: 'value', valueType: 'int' }],
				producedStackItems: [],
				stackAfter: [
					{ kind: 'value', valueType: 'int', knownValue: 1234 },
					{ kind: 'value', valueType: 'float' },
					{ kind: 'address', valueType: 'int', address: { memoryIndex: 0 } },
					{ kind: 'value', valueType: 'int' },
					{ kind: 'value', valueType: 'int' },
				],
			},
		} as const;

		expect(getStackAnalysisTooltipText(stackAnalysisLine)).toEqual([
			'before: [',
			'  int,',
			'  int=1234,',
			'  float,',
			'  ptr,',
			'  int,',
			'  -int',
			']',
			'after: [',
			'  int=1234,',
			'  float,',
			'  ptr,',
			'  int,',
			'  int',
			']',
		]);
		expect(getStackAnalysisTooltipContent(stackAnalysisLine).highlightTargets).toEqual([
			{ lineIndex: 6, column: 2, widthChars: 4, fillColor: 'tooltipConsumedHighlight' },
		]);
	});
});
