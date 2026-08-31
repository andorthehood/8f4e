import type { Stack } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { formatStack } from './formatStack';

describe('stack directive formatting', () => {
	it('shows known integer values without their types', () => {
		const stack: Stack = [
			{ kind: 'value', valueType: 'int', knownIntegerValue: 2 },
			{ kind: 'value', valueType: 'int', knownIntegerValue: 3 },
		];

		expect(formatStack(stack)).toBe('2, 3');
	});

	it('falls back to types for values without a known number', () => {
		const stack: Stack = [
			{ kind: 'value', valueType: 'int' },
			{ kind: 'value', valueType: 'int', knownIntegerValue: 3 },
			{ kind: 'value', valueType: 'float' },
			{ kind: 'value', valueType: 'float64' },
			{ kind: 'address', valueType: 'int', address: {} as never },
		];

		expect(formatStack(stack)).toBe('int, 3, float, float64, ptr');
	});

	it('formats an empty stack', () => {
		expect(formatStack([])).toBe('');
	});
});
