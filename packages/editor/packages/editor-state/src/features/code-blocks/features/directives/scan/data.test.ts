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
	it('should parse scan instruction with typed start pointer, element count, and absolute pointer', () => {
		const result = parseScanDirectiveData(['; @scan bufferAddress 16 playhead']);

		expect(result).toEqual([
			{
				startAddressMemoryId: 'bufferAddress',
				length: 16,
				pointerMemoryId: 'playhead',
				lineNumber: 0,
			},
		]);
	});

	it('should parse scan instruction with an address-of buffer start and a length memory identifier', () => {
		const result = parseScanDirectiveData(['; @scan &buffer1 length ptr1']);

		expect(result).toEqual([
			{
				startAddressMemoryId: '&buffer1',
				length: 'length',
				pointerMemoryId: 'ptr1',
				lineNumber: 0,
			},
		]);
	});

	it('should handle multiple scan instructions', () => {
		const result = parseScanDirectiveData(['; @scan bufferAddress 8 ptr1', 'mov a b', '; @scan &buffer2 len2 ptr2']);

		expect(result).toEqual([
			{
				startAddressMemoryId: 'bufferAddress',
				length: 8,
				pointerMemoryId: 'ptr1',
				lineNumber: 0,
			},
			{
				startAddressMemoryId: '&buffer2',
				length: 'len2',
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
		const result = parseScanDirectiveData(['mov a b', '; @scan startPtr 32 testPointer', 'add c d']);

		expect(result).toEqual([
			{
				startAddressMemoryId: 'startPtr',
				length: 32,
				pointerMemoryId: 'testPointer',
				lineNumber: 1,
			},
		]);
	});

	it('should ignore malformed scan directives without required arguments', () => {
		expect(parseScanDirectiveData(['; @scan'])).toEqual([]);
		expect(parseScanDirectiveData(['; @scan startPtr'])).toEqual([]);
		expect(parseScanDirectiveData(['; @scan startPtr 16'])).toEqual([]);
	});

	it('should ignore non-positive literal lengths', () => {
		expect(parseScanDirectiveData(['; @scan startPtr 0 pointer'])).toEqual([]);
		expect(parseScanDirectiveData(['; @scan startPtr -1 pointer'])).toEqual([]);
	});
});
