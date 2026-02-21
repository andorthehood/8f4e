import { describe, it, expect } from 'vitest';

import { compileConfig } from '../index';

describe('compileConfig block isolation', () => {
	it('resets scope between blocks', () => {
		const result = compileConfig([['scope "foo"', 'push 1', 'set'].join('\n'), ['push 2', 'set'].join('\n')]);

		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			line: 2,
			blockIndex: 1,
			message: 'Cannot set at root scope (scope stack is empty)',
		});
	});

	it('accumulates config writes across blocks in order', () => {
		const result = compileConfig([
			['scope "a"', 'push 1', 'set'].join('\n'),
			['scope "a"', 'push 2', 'set'].join('\n'),
			['scope "b"', 'push 3', 'set'].join('\n'),
		]);

		expect(result.errors).toEqual([]);
		expect(result.config).toEqual({
			a: 2,
			b: 3,
		});
	});

	it('collects parse and runtime errors from multiple blocks', () => {
		const result = compileConfig(['push "unterminated', 'set']);

		expect(result.config).toBeNull();
		expect(result.errors).toHaveLength(2);
		expect(result.errors[0]).toMatchObject({ kind: 'parse', blockIndex: 0, line: 1 });
		expect(result.errors[1]).toMatchObject({
			kind: 'exec',
			blockIndex: 1,
			line: 1,
			message: 'Cannot set at root scope (scope stack is empty)',
		});
	});
});
