import { describe, expect, it } from 'vitest';

import isIntermodularModuleNthReference from './isIntermodularModuleNthReference';

describe('isIntermodularModuleNthReference', () => {
	it('matches valid nth-item references', () => {
		expect(isIntermodularModuleNthReference('&module:0')).toBe(true);
		expect(isIntermodularModuleNthReference('&module:1')).toBe(true);
		expect(isIntermodularModuleNthReference('&notesMux2:3')).toBe(true);
		expect(isIntermodularModuleNthReference('&mod:10')).toBe(true);
	});

	it('rejects non-nth references', () => {
		expect(isIntermodularModuleNthReference('&module:')).toBe(false); // module-base reference
		expect(isIntermodularModuleNthReference('&module:buffer')).toBe(false); // named memory reference
		expect(isIntermodularModuleNthReference('module:0')).toBe(false); // missing & prefix
		expect(isIntermodularModuleNthReference('&module:0&')).toBe(false); // trailing &
		expect(isIntermodularModuleNthReference('&module:-1')).toBe(false); // negative index
		expect(isIntermodularModuleNthReference('&module:1.5')).toBe(false); // float index
	});
});
