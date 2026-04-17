import { expect, test } from 'vitest';

import createFunctionType from './createFunctionType';
import createTypeSection from './createTypeSection';

import { Section } from '../section';

test('createTypeSection wraps types correctly', () => {
	const types = [createFunctionType([], [])];
	const section = createTypeSection(types);
	expect(section[0]).toBe(Section.TYPE);
});
