import { describe, expect, it } from 'vitest';

import { createCrossfadeDirectiveData } from './data';
import crossfadeDirective from './plugin';

import { parseEditorDirectives } from '../utils';

function parseCrossfadeDirectiveData(code: string[]) {
	return parseEditorDirectives(code, [crossfadeDirective]).map(directive =>
		createCrossfadeDirectiveData(directive.args, directive.rawRow)
	);
}

describe('crossfade directive data', () => {
	it('parses a crossfade instruction with two addresses', () => {
		expect(parseCrossfadeDirectiveData(['; @crossfade &dry &wet'])).toEqual([
			{
				leftMemoryId: '&dry',
				rightMemoryId: '&wet',
				lineNumber: 0,
			},
		]);
	});

	it('rejects crossfade instructions without two addresses', () => {
		expect(parseCrossfadeDirectiveData(['; @crossfade &dry'])).toEqual([undefined]);
		expect(parseCrossfadeDirectiveData(['; @crossfade dry wet'])).toEqual([undefined]);
	});
});
