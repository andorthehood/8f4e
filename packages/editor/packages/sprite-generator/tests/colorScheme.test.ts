import { describe, expect, it } from 'vitest';

import { defaultColorScheme, resolveColorScheme } from '../src';

describe('color scheme resolution', () => {
	it('returns sprite-generator defaults when no overrides are provided', () => {
		const colorScheme = resolveColorScheme();

		expect(colorScheme).toEqual(defaultColorScheme);
		expect(colorScheme).not.toBe(defaultColorScheme);
		expect(colorScheme.text).not.toBe(defaultColorScheme.text);
		expect(colorScheme.fill).not.toBe(defaultColorScheme.fill);
		expect(colorScheme.icons).not.toBe(defaultColorScheme.icons);
	});

	it('merges partial overrides with sprite-generator defaults', () => {
		const colorScheme = resolveColorScheme({
			text: { code: '#112233' },
			fill: { wire: 'rgba(1,2,3,0.4)' },
		});

		expect(colorScheme.text.code).toBe('#112233');
		expect(colorScheme.fill.wire).toBe('rgba(1,2,3,0.4)');
		expect(colorScheme.text.lineNumber).toBe(defaultColorScheme.text.lineNumber);
		expect(colorScheme.fill.background).toBe(defaultColorScheme.fill.background);
		expect(colorScheme.icons.inputConnector).toBe(defaultColorScheme.icons.inputConnector);
	});
});
