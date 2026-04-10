import { describe, expect, it } from 'vitest';

import { read8f4eManual } from './manual';

describe('read8f4eManual', () => {
	it('loads the expected manual sections from the repository docs', async () => {
		const manual = await read8f4eManual();

		expect(manual.name).toBe('8f4e Manual');
		expect(manual.sections.map(section => section.title)).toEqual([
			'Introduction',
			'Instruction Reference Index',
			'Comments',
			'Identifier Prefixes and Metadata Queries',
			'Editor Directives',
		]);
		expect(manual.sections.find(section => section.path === 'docs/README.md')?.content).toContain(
			'# Introduction to 8f4e'
		);
		expect(
			manual.sections.find(section => section.path === 'packages/editor/docs/editor-directives.md')?.content
		).toContain('# Editor Directives');
	});
});
