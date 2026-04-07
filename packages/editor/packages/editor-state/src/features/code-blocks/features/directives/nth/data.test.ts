import { describe, it, expect } from 'vitest';

import { createNthDirectiveData } from './data';
import nthDirective from './plugin';

import { parseEditorDirectives } from '../utils';

function parseNthDirectiveData(code: string[]) {
	return parseEditorDirectives(code, [nthDirective])
		.map(directive => createNthDirectiveData(directive.args, directive.rawRow))
		.filter(result => result !== undefined);
}

describe('nth directive data', () => {
	it('parses a valid nth directive without arguments', () => {
		expect(parseNthDirectiveData(['; @nth'])).toEqual([
			{
				lineNumber: 0,
			},
		]);
	});

	it('ignores nth directives with arguments', () => {
		expect(parseNthDirectiveData(['; @nth 3'])).toEqual([]);
	});
});
