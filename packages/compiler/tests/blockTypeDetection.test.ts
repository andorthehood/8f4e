import { describe, test, expect } from 'vitest';

import { getBlockType } from '../src/syntax/getBlockType';
import { getFunctionId } from '../src/syntax/getFunctionId';
import { getModuleId } from '../src/syntax/getModuleId';

describe('getBlockType', () => {
	test('detects module blocks', () => {
		const code = ['module testModule', 'int x 5', 'moduleEnd'];
		expect(getBlockType(code)).toBe('module');
	});

	test('detects function blocks', () => {
		const code = ['function testFunction', 'param int x', 'functionEnd'];
		expect(getBlockType(code)).toBe('function');
	});

	test('detects config blocks', () => {
		const code = ['config', 'some config', 'configEnd'];
		expect(getBlockType(code)).toBe('config');
	});

	test('detects constants blocks', () => {
		const code = ['constants math', 'const PI 3.14159', 'constantsEnd'];
		expect(getBlockType(code)).toBe('constants');
	});

	test('returns unknown for blocks without proper markers', () => {
		const code = ['int x 5', 'add'];
		expect(getBlockType(code)).toBe('unknown');
	});

	test('returns unknown for mixed block types', () => {
		const code = ['module testModule', 'const PI 3.14159', 'functionEnd'];
		expect(getBlockType(code)).toBe('unknown');
	});

	test('handles whitespace in block markers', () => {
		const code = ['  constants   math  ', 'const PI 3.14159', '  constantsEnd  '];
		expect(getBlockType(code)).toBe('constants');
	});
});

describe('getModuleId', () => {
	test('extracts module identifier', () => {
		const code = ['module testModule', 'int x 5', 'moduleEnd'];
		expect(getModuleId(code)).toBe('testModule');
	});

	test('returns empty string if no module instruction', () => {
		const code = ['int x 5', 'add'];
		expect(getModuleId(code)).toBe('');
	});
});

describe('getFunctionId', () => {
	test('extracts function identifier', () => {
		const code = ['function myFunction', 'param int x', 'functionEnd'];
		expect(getFunctionId(code)).toBe('myFunction');
	});

	test('returns empty string if no function instruction', () => {
		const code = ['int x 5', 'add'];
		expect(getFunctionId(code)).toBe('');
	});
});
