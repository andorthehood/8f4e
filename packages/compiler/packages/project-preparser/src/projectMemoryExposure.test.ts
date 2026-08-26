import { describe, expect, it } from 'vitest';
import {
	parseProjectMemoryExposureLine,
	serializeProjectMemoryExposure,
	tryParseProjectMemoryExposureLine,
} from './projectMemoryExposure';

describe('project memory exposures', () => {
	it('parses and serializes a group-level memory exposure', () => {
		const exposure = parseProjectMemoryExposureLine('expose int* input &processor:input', 4);

		expect(exposure).toEqual({
			type: 'int*',
			name: 'input',
			targetModuleName: 'processor',
			targetMemoryName: 'input',
		});
		expect(serializeProjectMemoryExposure(exposure)).toBe('expose int* input &processor:input');
	});

	it.each([
		'expose bool value &source:value',
		'expose int value source:value',
		'expose int value &source',
		'expose int value &source:value extra',
		'expose int 0 &source:value',
		'expose int value &invalid/module:value',
		'expose int value &source:0',
	])('rejects the malformed exposure %s', line => {
		expect(() => parseProjectMemoryExposureLine(line, 7)).toThrow('Parse error at line 7');
	});

	it('tolerates incomplete live-editor lines', () => {
		expect(tryParseProjectMemoryExposureLine('expose int')).toBeUndefined();
		expect(tryParseProjectMemoryExposureLine('module source')).toBeUndefined();
	});
});
