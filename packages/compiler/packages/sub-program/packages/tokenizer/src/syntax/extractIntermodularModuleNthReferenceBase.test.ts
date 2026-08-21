import { describe, expect, it } from 'vitest';

import extractIntermodularModuleNthReferenceBase from './extractIntermodularModuleNthReferenceBase';

describe('extractIntermodularModuleNthReferenceBase', () => {
	it('extracts module name and index', () => {
		expect(extractIntermodularModuleNthReferenceBase('&module:0')).toEqual({
			module: 'module',
			index: 0,
		});
		expect(extractIntermodularModuleNthReferenceBase('&module:1')).toEqual({
			module: 'module',
			index: 1,
		});
		expect(extractIntermodularModuleNthReferenceBase('&notesMux2:3')).toEqual({
			module: 'notesMux2',
			index: 3,
		});
		expect(extractIntermodularModuleNthReferenceBase('&mod:10')).toEqual({
			module: 'mod',
			index: 10,
		});
	});
});
