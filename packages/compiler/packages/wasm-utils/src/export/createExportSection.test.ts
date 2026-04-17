import { expect, test } from 'vitest';

import createFunctionExport from './createFunctionExport';
import createExportSection from './createExportSection';

import { Section } from '../section';

test('createExportSection wraps exports correctly', () => {
	const exports = [createFunctionExport('main', 0)];
	const section = createExportSection(exports);
	expect(section[0]).toBe(Section.EXPORT);
});
