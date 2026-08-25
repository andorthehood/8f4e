import { describe, expect, expectTypeOf, it } from 'vitest';
import {
	createChildProjectGroupPath,
	createProjectModuleId,
	getProjectGroupPathFromModuleId,
	type ProjectBlock,
	type ProjectBlockId,
	type ProjectEntryName,
	type ProjectGroupObjectModel,
	type ProjectModuleBlock,
	type ProjectObjectModel,
	ROOT_PROJECT_GROUP_PATH,
} from './project';

describe('ProjectObjectModel', () => {
	it('encodes block kinds through top-level collection membership', () => {
		expectTypeOf<ProjectBlock['id']>().toEqualTypeOf<ProjectBlockId>();
		expectTypeOf<ProjectModuleBlock['entry']>().toEqualTypeOf<ProjectEntryName>();
		expectTypeOf<ProjectObjectModel['modules']>().toEqualTypeOf<ProjectModuleBlock[]>();
		expectTypeOf<ProjectObjectModel['functions']>().toEqualTypeOf<ProjectBlock[]>();
		expectTypeOf<ProjectObjectModel['groups']>().toEqualTypeOf<ProjectGroupObjectModel[]>();
		expectTypeOf<ProjectGroupObjectModel['entry']>().toEqualTypeOf<ProjectEntryName>();
	});

	it('creates canonical group paths and module ids', () => {
		const audioPath = createChildProjectGroupPath(ROOT_PROJECT_GROUP_PATH, 'audio');
		const voicesPath = createChildProjectGroupPath(audioPath, 'voices/lead');

		expect(audioPath).toBe('audio');
		expect(voicesPath).toBe('audio/voices%2Flead');
		expect(createProjectModuleId(ROOT_PROJECT_GROUP_PATH, 'counter')).toBe('counter');
		expect(createProjectModuleId(voicesPath, 'counter-left')).toBe('audio/voices%2Flead/counter-left');
		expect(getProjectGroupPathFromModuleId('counter')).toBe(ROOT_PROJECT_GROUP_PATH);
		expect(getProjectGroupPathFromModuleId('audio/voices/counter')).toBe('audio/voices');
	});
});
