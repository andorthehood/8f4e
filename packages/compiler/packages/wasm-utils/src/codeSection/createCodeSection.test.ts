import { expect, test } from 'vitest';

import createFunction from './createFunction';
import createCodeSection from './createCodeSection';

import { Section } from '../section';

test('createCodeSection wraps function bodies correctly', () => {
	const bodies = [createFunction([], [65, 1])];
	const section = createCodeSection(bodies);
	expect(section[0]).toBe(Section.CODE);
});
