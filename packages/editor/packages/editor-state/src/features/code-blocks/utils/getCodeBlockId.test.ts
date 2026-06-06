import { describe, expect, it } from 'vitest';
import getCodeBlockId from './getCodeBlockId';

describe('getCodeBlockId', () => {
	it('returns raw module names for module blocks', () => {
		expect(getCodeBlockId(['module testModule', '', 'moduleEnd'])).toBe('testModule');
	});

	it('returns raw function names for function blocks', () => {
		expect(getCodeBlockId(['function testFunction', '', 'functionEnd'])).toBe('testFunction');
	});

	it('returns raw constants names for constants blocks', () => {
		expect(getCodeBlockId(['constants env', '', 'constantsEnd'])).toBe('env');
	});

	it('returns raw prototype names for prototype blocks', () => {
		expect(getCodeBlockId(['prototype oscillatorState', '', 'prototypeEnd'])).toBe('oscillatorState');
	});

	it('returns empty string for note blocks', () => {
		expect(getCodeBlockId(['note', '', 'noteEnd'])).toBe('');
		expect(getCodeBlockId(['note fragmentShaderPostprocess', '', 'noteEnd'])).toBe('');
	});

	it('returns empty string when no block name is found', () => {
		expect(getCodeBlockId(['some random code', 'without markers'])).toBe('');
	});

	it('ignores trailing comments after names', () => {
		expect(getCodeBlockId(['module testModule ; comment', '', 'moduleEnd'])).toBe('testModule');
	});
});
