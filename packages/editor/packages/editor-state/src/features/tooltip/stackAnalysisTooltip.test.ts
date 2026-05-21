import { describe, expect, it } from 'vitest';

import { getStackAnalysisTooltipText } from './stackAnalysisTooltip';

describe('stack analysis tooltip text', () => {
	it('formats selected line stack analysis', () => {
		expect(
			getStackAnalysisTooltipText({
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
			})
		).toEqual(['before [int=0, >int=1, >int=2]', 'after: [int=0, int<]']);
	});

	it('formats long stack analysis as multiline blocks', () => {
		expect(
			getStackAnalysisTooltipText({
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
			})
		).toEqual([
			'before: [',
			'  int,',
			'  int=1234,',
			'  float,',
			'  ptr,',
			'  int,',
			'  >int',
			']',
			'after: [',
			'  int=1234,',
			'  float,',
			'  ptr,',
			'  int,',
			'  int',
			']',
		]);
	});
});
