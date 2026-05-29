import { describe, expect, test } from 'vitest';

import createFunctionImport from './createFunctionImport';

import { ImportDesc } from '../section';

describe('createFunctionImport', () => {
	test('generates a function import entry', () => {
		expect(createFunctionImport('test', 'assertFailed', 3)).toStrictEqual([
			4,
			116,
			101,
			115,
			116,
			12,
			97,
			115,
			115,
			101,
			114,
			116,
			70,
			97,
			105,
			108,
			101,
			100,
			ImportDesc.FUNC,
			3,
		]);
	});
});
