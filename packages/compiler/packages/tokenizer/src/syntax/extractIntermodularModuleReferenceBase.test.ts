import { describe, expect, it } from 'vitest';

import extractIntermodularModuleReferenceBase from './extractIntermodularModuleReferenceBase';

describe('extractIntermodularModuleReferenceBase', () => {
	it('extracts the module identifier for start references', () => {
		expect(extractIntermodularModuleReferenceBase('&module:')).toEqual({
			module: 'module',
			isEndAddress: false,
		});
		expect(extractIntermodularModuleReferenceBase('&sourceModule:')).toEqual({
			module: 'sourceModule',
			isEndAddress: false,
		});
	});

	it('extracts the module identifier for end references', () => {
		expect(extractIntermodularModuleReferenceBase('module:&')).toEqual({
			module: 'module',
			isEndAddress: true,
		});
		expect(extractIntermodularModuleReferenceBase('sourceModule:&')).toEqual({
			module: 'sourceModule',
			isEndAddress: true,
		});
	});
});
