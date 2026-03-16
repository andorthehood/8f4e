import { describe, it, expect } from 'vitest';

import { deriveDirectiveState } from '../registry';

describe('group directive plugin', () => {
	it('sets groupName from a valid @group directive', () => {
		const result = deriveDirectiveState(['module foo', '; @group audio-chain', 'moduleEnd']);
		expect(result.blockState.groupName).toBe('audio-chain');
		expect(result.blockState.groupNonstick).toBe(false);
	});

	it('sets groupNonstick when nonstick argument is present', () => {
		const result = deriveDirectiveState(['module foo', '; @group audio-chain nonstick', 'moduleEnd']);
		expect(result.blockState.groupName).toBe('audio-chain');
		expect(result.blockState.groupNonstick).toBe(true);
	});

	it('ignores @group directive with no group name argument', () => {
		const result = deriveDirectiveState(['module foo', '; @group', 'moduleEnd']);
		expect(result.blockState.groupName).toBeUndefined();
		expect(result.blockState.groupNonstick).toBeUndefined();
	});

	it('leaves groupName undefined when no @group directive is present', () => {
		const result = deriveDirectiveState(['module foo', 'moduleEnd']);
		expect(result.blockState.groupName).toBeUndefined();
		expect(result.blockState.groupNonstick).toBeUndefined();
	});

	it('does not set groupNonstick for an unrecognised second argument', () => {
		const result = deriveDirectiveState(['module foo', '; @group myGroup sticky', 'moduleEnd']);
		expect(result.blockState.groupName).toBe('myGroup');
		expect(result.blockState.groupNonstick).toBe(false);
	});

	it('uses the first @group directive when multiple are present', () => {
		const result = deriveDirectiveState(['module foo', '; @group firstGroup', '; @group secondGroup', 'moduleEnd']);
		expect(result.blockState.groupName).toBe('firstGroup');
	});

	it('handles group names with hyphens and underscores', () => {
		const result = deriveDirectiveState(['module foo', '; @group audio_chain-1', 'moduleEnd']);
		expect(result.blockState.groupName).toBe('audio_chain-1');
	});
});
