import { describe, expect, it } from 'vitest';

import isIntermodularModuleReference from './isIntermodularModuleReference';

describe('isIntermodularModuleReference', () => {
	it('matches valid intermodular module-base references', () => {
		expect(isIntermodularModuleReference('&module:')).toBe(true);
		expect(isIntermodularModuleReference('&notesMux2:')).toBe(true);
		expect(isIntermodularModuleReference('module:&')).toBe(true);
		expect(isIntermodularModuleReference('notesMux2:&')).toBe(true);
	});

	it('rejects invalid references', () => {
		expect(isIntermodularModuleReference('&buffer')).toBe(false);
		expect(isIntermodularModuleReference('&module:memory')).toBe(false);
		expect(isIntermodularModuleReference('module:')).toBe(false);
		expect(isIntermodularModuleReference('&module:&')).toBe(false);
		expect(isIntermodularModuleReference('&module::')).toBe(false);
		expect(isIntermodularModuleReference('&module.memory')).toBe(false);
	});
});
