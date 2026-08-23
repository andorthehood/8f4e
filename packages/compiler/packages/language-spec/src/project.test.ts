import { describe, expectTypeOf, it } from 'vitest';
import type { ProjectBlock, ProjectBlockId, ProjectEntryName, ProjectModuleBlock, ProjectObjectModel } from './project';

describe('ProjectObjectModel', () => {
	it('encodes block kinds through top-level collection membership', () => {
		expectTypeOf<ProjectBlock['id']>().toEqualTypeOf<ProjectBlockId>();
		expectTypeOf<ProjectModuleBlock['entry']>().toEqualTypeOf<ProjectEntryName>();
		expectTypeOf<ProjectObjectModel['modules']>().toEqualTypeOf<ProjectModuleBlock[]>();
		expectTypeOf<ProjectObjectModel['functions']>().toEqualTypeOf<ProjectBlock[]>();
		expectTypeOf<ProjectObjectModel['groups']>().toEqualTypeOf<ProjectObjectModel[]>();
		expectTypeOf<ProjectObjectModel['entry']>().toEqualTypeOf<ProjectEntryName | undefined>();
		expectTypeOf<ProjectBlock>().not.toHaveProperty('type');
		expectTypeOf<ProjectBlock>().not.toHaveProperty('entry');
	});
});
