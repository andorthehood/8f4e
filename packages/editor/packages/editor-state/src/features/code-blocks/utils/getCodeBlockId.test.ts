import { describe, expect, it } from 'vitest';
import getCodeBlockId from './getCodeBlockId';

describe('getCodeBlockId', () => {
	it('returns module ID for module blocks', () => {
		const code = ['module testModule', '', 'moduleEnd'];
		expect(getCodeBlockId(code)).toBe('module_testModule');
	});

	it('returns function ID for function blocks', () => {
		const code = ['function testFunction', '', 'functionEnd'];
		expect(getCodeBlockId(code)).toBe('function_testFunction');
	});

	it('returns constants ID for constants blocks', () => {
		const code = ['constants env', '', 'constantsEnd'];
		expect(getCodeBlockId(code)).toBe('constants_env');
	});

	it('returns prototype ID for prototype blocks', () => {
		const code = ['prototype oscillatorState', '', 'prototypeEnd'];
		expect(getCodeBlockId(code)).toBe('prototype_oscillatorState');
	});

	it('returns empty string for note blocks', () => {
		expect(getCodeBlockId(['note', '', 'noteEnd'])).toBe('');
		expect(getCodeBlockId(['note fragmentShaderPostprocess', '', 'noteEnd'])).toBe('');
	});

	it('returns empty string when no ID is found', () => {
		const code = ['some random code', 'without markers'];
		expect(getCodeBlockId(code)).toBe('');
	});

	it('prioritizes module ID over other types', () => {
		// This is an edge case - normally code wouldn't have multiple block types
		const code = ['module testModule', 'function testFunction', 'moduleEnd'];
		expect(getCodeBlockId(code)).toBe('module_testModule');
	});
});
