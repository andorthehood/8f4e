import { describe, expect, test } from 'vitest';

import createFunctionImport from './createFunctionImport';

import { ImportDesc } from '../section';

describe('createFunctionImport', () => {
	test('generates a function import entry', () => {
		expect(createFunctionImport('host', 'assert', 3)).toStrictEqual([
			4,
			104,
			111,
			115,
			116,
			6,
			97,
			115,
			115,
			101,
			114,
			116,
			ImportDesc.FUNC,
			3,
		]);
	});
});
