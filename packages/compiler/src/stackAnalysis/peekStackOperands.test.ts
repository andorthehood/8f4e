import { describe, expect, it } from 'vitest';

import { peekStackOperands } from './peekStackOperands';

import type { StackItem } from '@8f4e/compiler-types';

describe('peekStackOperands', () => {
	it('returns the last N operands in stack order', () => {
		const stack: StackItem[] = [{ isInteger: true }, { isInteger: false }, { isInteger: true }];
		expect(peekStackOperands(stack, 2)).toEqual([{ isInteger: false }, { isInteger: true }]);
	});

	it('returns an empty array when there are not enough operands', () => {
		const stack: StackItem[] = [{ isInteger: true }];
		expect(peekStackOperands(stack, 2)).toEqual([]);
	});
});
