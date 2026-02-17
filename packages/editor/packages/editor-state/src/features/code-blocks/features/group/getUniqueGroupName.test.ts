import { describe, it, expect } from 'vitest';

import { getUniqueGroupName, createGroupNameMapping } from './getUniqueGroupName';

import { createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';

describe('getUniqueGroupName', () => {
	it('should return the original name if no collision', () => {
		const existingNames = new Set(['foo', 'bar']);
		expect(getUniqueGroupName('baz', existingNames)).toBe('baz');
	});

	it('should append 1 to a name without trailing number on collision', () => {
		const existingNames = new Set(['foo', 'bar']);
		expect(getUniqueGroupName('foo', existingNames)).toBe('foo1');
	});

	it('should increment trailing number on collision', () => {
		const existingNames = new Set(['foo', 'foo1']);
		expect(getUniqueGroupName('foo1', existingNames)).toBe('foo2');
	});

	it('should handle names ending with multi-digit numbers', () => {
		const existingNames = new Set(['bass09', 'bass10']);
		// bass09 + 1 = bass10, but that exists, so bass10 + 1 = bass11
		expect(getUniqueGroupName('bass09', existingNames)).toBe('bass11');
	});

	it('should keep incrementing until finding a unique name', () => {
		const existingNames = new Set(['foo', 'foo1', 'foo2', 'foo3']);
		expect(getUniqueGroupName('foo', existingNames)).toBe('foo4');
	});

	it('should handle large numbers correctly', () => {
		const existingNames = new Set(['test99']);
		expect(getUniqueGroupName('test99', existingNames)).toBe('test100');
	});

	it('should work with single character names', () => {
		const existingNames = new Set(['a', 'a1']);
		expect(getUniqueGroupName('a', existingNames)).toBe('a2');
	});

	it('should handle empty existing names set', () => {
		const existingNames = new Set<string>();
		expect(getUniqueGroupName('foo', existingNames)).toBe('foo');
	});
});

describe('createGroupNameMapping', () => {
	it('should create identity mapping for non-colliding names', () => {
		const pastedNames = ['group1', 'group2'];
		const codeBlocks = [
			createMockCodeBlock({ groupName: 'existing1' }),
			createMockCodeBlock({ groupName: 'existing2' }),
		];

		const mapping = createGroupNameMapping(pastedNames, codeBlocks);

		expect(mapping.get('group1')).toBe('group1');
		expect(mapping.get('group2')).toBe('group2');
	});

	it('should rename colliding group names', () => {
		const pastedNames = ['foo', 'bar'];
		const codeBlocks = [createMockCodeBlock({ groupName: 'foo' }), createMockCodeBlock({ groupName: 'bar' })];

		const mapping = createGroupNameMapping(pastedNames, codeBlocks);

		expect(mapping.get('foo')).toBe('foo1');
		expect(mapping.get('bar')).toBe('bar1');
	});

	it('should handle multiple blocks with same group name', () => {
		const pastedNames = ['audio', 'audio', 'audio'];
		const codeBlocks = [createMockCodeBlock({ groupName: 'audio' })];

		const mapping = createGroupNameMapping(pastedNames, codeBlocks);

		// All three should map to the same renamed group
		expect(mapping.get('audio')).toBe('audio1');
		expect(mapping.size).toBe(1); // Only one mapping
	});

	it('should avoid collisions between pasted groups', () => {
		const pastedNames = ['foo', 'foo1'];
		const codeBlocks = [createMockCodeBlock({ groupName: 'foo' })];

		const mapping = createGroupNameMapping(pastedNames, codeBlocks);

		// Both should get unique names
		expect(mapping.get('foo')).toBe('foo1');
		expect(mapping.get('foo1')).toBe('foo2');
		// They should have different mappings
		expect(mapping.get('foo')).not.toBe(mapping.get('foo1'));
	});

	it('should work with empty code blocks', () => {
		const pastedNames = ['group1', 'group2'];
		const codeBlocks = [];

		const mapping = createGroupNameMapping(pastedNames, codeBlocks);

		expect(mapping.get('group1')).toBe('group1');
		expect(mapping.get('group2')).toBe('group2');
	});

	it('should work with code blocks without group names', () => {
		const pastedNames = ['group1'];
		const codeBlocks = [createMockCodeBlock({ groupName: undefined }), createMockCodeBlock({ groupName: undefined })];

		const mapping = createGroupNameMapping(pastedNames, codeBlocks);

		expect(mapping.get('group1')).toBe('group1');
	});

	it('should handle complex collision scenario', () => {
		const pastedNames = ['audio', 'audio1', 'bass09'];
		const codeBlocks = [
			createMockCodeBlock({ groupName: 'audio' }),
			createMockCodeBlock({ groupName: 'audio1' }),
			createMockCodeBlock({ groupName: 'bass09' }),
		];

		const mapping = createGroupNameMapping(pastedNames, codeBlocks);

		expect(mapping.get('audio')).toBe('audio2');
		expect(mapping.get('audio1')).toBe('audio3');
		expect(mapping.get('bass09')).toBe('bass10');
	});
});
