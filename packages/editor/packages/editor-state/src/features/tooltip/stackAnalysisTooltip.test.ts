import { describe, expect, it } from 'vitest';

import { getStackAnalysisTooltipContent, getStackAnalysisTooltipText } from './stackAnalysisTooltip';

describe('stack analysis tooltip text', () => {
	it('formats selected line stack analysis', () => {
		const stackAnalysisLine = {
			lineNumberBeforeMacroExpansion: 2,
			lineNumberAfterMacroExpansion: 2,
			instruction: 'add',
			stackAnalysis: {
				stackBefore: [
					{ isInteger: true, knownIntegerValue: 0 },
					{ isInteger: true, knownIntegerValue: 1 },
					{ isInteger: true, knownIntegerValue: 2 },
				],
				consumedOperands: [
					{ isInteger: true, knownIntegerValue: 1 },
					{ isInteger: true, knownIntegerValue: 2 },
				],
				producedStackItems: [{ isInteger: true }],
				stackAfter: [{ isInteger: true, knownIntegerValue: 0 }, { isInteger: true }],
			},
		} as const;

		expect(getStackAnalysisTooltipText(stackAnalysisLine)).toEqual([
			'before [int=0, -int=1, -int=2]',
			'after: [int=0, +int]',
		]);
		expect(getStackAnalysisTooltipContent(stackAnalysisLine).highlightTargets).toEqual([
			{ lineIndex: 0, column: 15, widthChars: 6, fillColor: 'tooltipHighlight' },
			{ lineIndex: 0, column: 23, widthChars: 6, fillColor: 'tooltipHighlight' },
			{ lineIndex: 1, column: 15, widthChars: 4, fillColor: 'tooltipHighlight' },
		]);
	});

	it('formats long stack analysis as multiline blocks', () => {
		const stackAnalysisLine = {
			lineNumberBeforeMacroExpansion: 6,
			lineNumberAfterMacroExpansion: 6,
			instruction: 'drop',
			stackAnalysis: {
				stackBefore: [
					{ isInteger: true },
					{ isInteger: true, knownIntegerValue: 1234 },
					{ isInteger: false },
					{ isInteger: true, pointeeBaseType: 'int' },
					{ isInteger: true },
					{ isInteger: true },
				],
				consumedOperands: [{ isInteger: true }],
				producedStackItems: [],
				stackAfter: [
					{ isInteger: true, knownIntegerValue: 1234 },
					{ isInteger: false },
					{ isInteger: true, pointeeBaseType: 'int' },
					{ isInteger: true },
					{ isInteger: true },
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
			{ lineIndex: 6, column: 2, widthChars: 4, fillColor: 'tooltipHighlight' },
		]);
	});
});
