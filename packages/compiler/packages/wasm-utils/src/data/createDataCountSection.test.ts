import { test, expect } from 'vitest';

import createDataCountSection from './createDataCountSection';

import { Section } from '../section';

test('createDataCountSection wraps the segment count', () => {
	expect(createDataCountSection(1)).toStrictEqual([Section.DATA_COUNT, 0x01, 0x01]);
});
