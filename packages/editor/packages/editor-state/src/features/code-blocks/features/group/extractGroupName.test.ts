import { describe, it, expect } from 'vitest';

import { extractGroupName } from './extractGroupName';

describe('extractGroupName', () => {
	it('should extract group name from code with @group directive', () => {
		const code = ['module foo', '; @group audio', 'moduleEnd'];
		const groupName = extractGroupName(code);
		expect(groupName).toBe('audio');
	});

	it('should return undefined if no @group directive', () => {
		const code = ['module foo', 'moduleEnd'];
		const groupName = extractGroupName(code);
		expect(groupName).toBeUndefined();
	});

	it('should extract group name with nonstick flag', () => {
		const code = ['module foo', '; @group audio nonstick', 'moduleEnd'];
		const groupName = extractGroupName(code);
		expect(groupName).toBe('audio');
	});

	it('should handle whitespace variations', () => {
		const code = ['module foo', '  ;  @group  audio  ', 'moduleEnd'];
		const groupName = extractGroupName(code);
		expect(groupName).toBe('audio');
	});
});
