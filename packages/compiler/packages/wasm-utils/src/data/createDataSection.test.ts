import { test, expect } from 'vitest';

import createDataSection from './createDataSection';

import { Section } from '../section';

test('createDataSection wraps data segments correctly', () => {
	expect(createDataSection([[0x01, 0x01, 42]])).toStrictEqual([Section.DATA, 0x04, 0x01, 0x01, 0x01, 42]);
});
