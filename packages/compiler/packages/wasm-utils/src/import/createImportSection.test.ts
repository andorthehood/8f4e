import { expect, test } from 'vitest';

import createMemoryImport from './createMemoryImport';
import createImportSection from './createImportSection';

import { Section } from '../section';

test('createImportSection wraps imports correctly', () => {
	const imports = [createMemoryImport('js', 'memory')];
	const section = createImportSection(imports);
	expect(section[0]).toBe(Section.IMPORT);
});
