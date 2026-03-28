import { describe, it, expect } from 'vitest';

import { createScanDirectiveData } from './data';
import scanDirective from './plugin';

import { parseEditorDirectives } from '../utils';

function parseScanDirectiveData(code: string[]) {
	return parseEditorDirectives(code, [scanDirective])
		.map(directive => createScanDirectiveData(directive.args, directive.rawRow))
		.filter(result => result !== undefined);
}

describe('scan directive data', () => {
	it('should parse scan instruction with array and pointer', () => {
		const result = parseScanDirectiveData(['; @scan myArray myPointer']);

		expect(result).toEqual([
			{
				arrayMemoryId: 'myArray',
				pointerMemoryId: 'myPointer',
				lineNumber: 0,
			},
		]);
	});

	it('should handle multiple scan instructions', () => {
		const result = parseScanDirectiveData(['; @scan buffer1 ptr1', 'mov a b', '; @scan buffer2 ptr2']);

		expect(result).toEqual([
			{
				arrayMemoryId: 'buffer1',
				pointerMemoryId: 'ptr1',
				lineNumber: 0,
			},
			{
				arrayMemoryId: 'buffer2',
				pointerMemoryId: 'ptr2',
				lineNumber: 2,
			},
		]);
	});

	it('should return empty array when no scan instructions found', () => {
		expect(parseScanDirectiveData(['mov a b', 'add c d', 'sub e f'])).toEqual([]);
	});

	it('should handle empty code array', () => {
		expect(parseScanDirectiveData([])).toEqual([]);
	});

	it('should parse scan instruction at different line positions', () => {
		const result = parseScanDirectiveData(['mov a b', '; @scan testArray testPointer', 'add c d']);

		expect(result).toEqual([
			{
				arrayMemoryId: 'testArray',
				pointerMemoryId: 'testPointer',
				lineNumber: 1,
			},
		]);
	});

	it('should ignore malformed scan directives without required arguments', () => {
		expect(parseScanDirectiveData(['; @scan'])).toEqual([]);
		expect(parseScanDirectiveData(['; @scan myBuffer'])).toEqual([]);
	});
});
