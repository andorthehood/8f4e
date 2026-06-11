import { describe, expect, it } from 'vitest';

import { getProjectBlockName, isProjectGapLine } from './projectLines';

describe('getProjectBlockName', () => {
	it('reads the single required name from entry and group openers', () => {
		expect(getProjectBlockName('entry main', 1, 'entry')).toBe('main');
		expect(getProjectBlockName('group audio', 2, 'group')).toBe('audio');
		expect(getProjectBlockName('group\toscillator', 3, 'group')).toBe('oscillator');
	});

	it('rejects missing or extra names', () => {
		expect(() => getProjectBlockName('entry', 4, 'entry')).toThrow('entry requires exactly one name');
		expect(() => getProjectBlockName('group audio nested', 5, 'group')).toThrow('group requires exactly one name');
	});
});

describe('isProjectGapLine', () => {
	it('treats blank lines and project comments as gaps between project blocks', () => {
		expect(isProjectGapLine('')).toBe(true);
		expect(isProjectGapLine('# project comment')).toBe(true);
		expect(isProjectGapLine('; project comment')).toBe(true);
		expect(isProjectGapLine('// project comment')).toBe(true);
	});

	it('does not treat code as a project gap', () => {
		expect(isProjectGapLine('module counter')).toBe(false);
		expect(isProjectGapLine('push 1')).toBe(false);
	});
});
