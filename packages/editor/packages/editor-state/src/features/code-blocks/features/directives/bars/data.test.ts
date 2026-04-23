import { describe, it, expect } from 'vitest';

import { createBarsDirectiveData } from './data';
import barsDirective from './plugin';

import { parseEditorDirectives } from '../utils';

function parseBarsDirectiveData(code: string[]) {
	return parseEditorDirectives(code, [barsDirective]).map(directive =>
		createBarsDirectiveData(directive.args, directive.rawRow)
	);
}

describe('bars directive data', () => {
	it('parses bars instruction with explicit array length memory', () => {
		expect(parseBarsDirectiveData(['; @bars bins arrayLength'])).toEqual([
			{ startAddressMemoryId: 'bins', lineNumber: 0, length: 'arrayLength' },
		]);
	});

	it('rejects bars instruction without an explicit array length', () => {
		expect(parseBarsDirectiveData(['; @bars bins'])).toEqual([undefined]);
	});

	it('parses bars instruction with a literal element count', () => {
		expect(parseBarsDirectiveData(['; @bars bins 128'])).toEqual([
			{ startAddressMemoryId: 'bins', lineNumber: 0, length: 128 },
		]);
	});

	it('parses bars instruction with both length and range override', () => {
		expect(parseBarsDirectiveData(['; @bars bins 64 0 1'])).toEqual([
			{ startAddressMemoryId: 'bins', lineNumber: 0, length: 64, minValueOverride: 0, maxValueOverride: 1 },
		]);
	});
});
