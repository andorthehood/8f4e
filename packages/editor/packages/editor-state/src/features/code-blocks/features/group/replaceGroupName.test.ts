import { describe, it, expect } from 'vitest';

import { replaceGroupName } from './replaceGroupName';

describe('replaceGroupName', () => {
	it('should replace group name in a simple @group directive', () => {
		const line = '; @group audio';
		const result = replaceGroupName(line, 'audio', 'audio1');
		expect(result).toBe('; @group audio1');
	});

	it('should replace group name and preserve nonstick flag', () => {
		const line = '; @group audio nonstick';
		const result = replaceGroupName(line, 'audio', 'audio1');
		expect(result).toBe('; @group audio1 nonstick');
	});

	it('should preserve leading whitespace', () => {
		const line = '  ; @group audio';
		const result = replaceGroupName(line, 'audio', 'audio1');
		expect(result).toBe('  ; @group audio1');
	});

	it('should not replace if group name does not match', () => {
		const line = '; @group video';
		const result = replaceGroupName(line, 'audio', 'audio1');
		expect(result).toBe('; @group video');
	});

	it('should not modify non-group-directive lines', () => {
		const line = 'module test';
		const result = replaceGroupName(line, 'audio', 'audio1');
		expect(result).toBe('module test');
	});

	it('should handle group names with hyphens', () => {
		const line = '; @group audio-chain';
		const result = replaceGroupName(line, 'audio-chain', 'audio-chain1');
		expect(result).toBe('; @group audio-chain1');
	});

	it('should handle group names with numbers', () => {
		const line = '; @group bass09';
		const result = replaceGroupName(line, 'bass09', 'bass10');
		expect(result).toBe('; @group bass10');
	});

	it('should replace exact match only', () => {
		const line = '; @group audioFX';
		const result = replaceGroupName(line, 'audio', 'audio1');
		expect(result).toBe('; @group audioFX'); // Should not replace partial match
	});
});
