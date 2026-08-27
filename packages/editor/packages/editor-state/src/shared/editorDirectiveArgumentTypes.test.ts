import { describe, expect, it } from 'vitest';
import {
	isMemoryTarget,
	isPointerSource,
	parseElementCount,
	parseFiniteNumber,
	parseInteger,
} from './editorDirectiveArgumentTypes';

describe('editor directive argument types', () => {
	it('distinguishes plain memory targets from pointer sources', () => {
		expect(isMemoryTarget('gain')).toBe(true);
		expect(isMemoryTarget('group/module:gain')).toBe(true);
		expect(isMemoryTarget('&gain')).toBe(false);
		expect(isMemoryTarget('*gain')).toBe(false);
		expect(isMemoryTarget('gain[1]')).toBe(false);
		expect(isPointerSource('bufferPointer')).toBe(true);
		expect(isPointerSource('&buffer')).toBe(true);
		expect(isPointerSource('&buffer[1]')).toBe(false);
	});

	it('parses finite decimal numbers and exact integers', () => {
		expect(parseFiniteNumber('-0.5')).toBe(-0.5);
		expect(parseFiniteNumber('1e-3')).toBe(0.001);
		expect(parseFiniteNumber('NaN')).toBeUndefined();
		expect(parseInteger('60')).toBe(60);
		expect(parseInteger('60.5')).toBeUndefined();
	});

	it('accepts only positive literal, memory, and count element counts', () => {
		expect(parseElementCount('128')).toBe(128);
		expect(parseElementCount('length')).toBe('length');
		expect(parseElementCount('count(buffer)')).toBe('count(buffer)');
		expect(parseElementCount('0')).toBeUndefined();
		expect(parseElementCount('&length')).toBeUndefined();
		expect(parseElementCount('count(&buffer)')).toBeUndefined();
	});
});
