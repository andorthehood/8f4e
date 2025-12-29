import { describe, it, expect, vi } from 'vitest';

import { moduleCategoriesMenu, builtInModuleMenu, projectCategoriesMenu, projectMenu } from '../menus';

import type { State, ModuleMetadata, ProjectMetadata } from '../../../types';

const mockState = {
	callbacks: {
		getListOfModules: vi.fn(),
		getModule: vi.fn(),
		getListOfProjects: vi.fn(),
		getProject: vi.fn(),
	},
} as unknown as State;

describe('moduleCategoriesMenu', () => {
	it('should create flat menu for modules without nested categories', async () => {
		const modules: ModuleMetadata[] = [
			{ slug: 'mod1', title: 'Module 1', category: 'Effects' },
			{ slug: 'mod2', title: 'Module 2', category: 'Oscillators' },
		];

		(mockState.callbacks.getListOfModules as ReturnType<typeof vi.fn>).mockResolvedValue(modules);

		const menu = await moduleCategoriesMenu(mockState);

		expect(menu).toHaveLength(2);
		expect(menu[0]).toEqual({
			title: 'Effects',
			action: 'openSubMenu',
			payload: { menu: 'builtInModuleMenu', categoryPath: 'Effects' },
			close: false,
		});
		expect(menu[1]).toEqual({
			title: 'Oscillators',
			action: 'openSubMenu',
			payload: { menu: 'builtInModuleMenu', categoryPath: 'Oscillators' },
			close: false,
		});
	});

	it('should create nested menu for modules with slash-delimited categories', async () => {
		const modules: ModuleMetadata[] = [
			{ slug: 'mod1', title: 'Module 1', category: 'Effects/Time' },
			{ slug: 'mod2', title: 'Module 2', category: 'Effects/Distortion' },
			{ slug: 'mod3', title: 'Module 3', category: 'Oscillators' },
		];

		(mockState.callbacks.getListOfModules as ReturnType<typeof vi.fn>).mockResolvedValue(modules);

		const menu = await moduleCategoriesMenu(mockState);

		expect(menu).toHaveLength(2);
		expect(menu[0]).toEqual({
			title: 'Effects',
			action: 'openSubMenu',
			payload: { menu: 'moduleCategoriesMenu', categoryPath: 'Effects' },
			close: false,
		});
		expect(menu[1]).toEqual({
			title: 'Oscillators',
			action: 'openSubMenu',
			payload: { menu: 'builtInModuleMenu', categoryPath: 'Oscillators' },
			close: false,
		});
	});

	it('should handle empty module list', async () => {
		(mockState.callbacks.getListOfModules as ReturnType<typeof vi.fn>).mockResolvedValue([]);

		const menu = await moduleCategoriesMenu(mockState);

		expect(menu).toHaveLength(0);
	});
});

describe('builtInModuleMenu', () => {
	it('should return modules for a given category path', async () => {
		const modules: ModuleMetadata[] = [
			{ slug: 'mod1', title: 'Module 1', category: 'Effects/Time' },
			{ slug: 'mod2', title: 'Module 2', category: 'Effects/Distortion' },
		];

		(mockState.callbacks.getListOfModules as ReturnType<typeof vi.fn>).mockResolvedValue(modules);

		const menu = await builtInModuleMenu(mockState, { categoryPath: 'Effects/Time' });

		expect(menu).toHaveLength(1);
		expect(menu[0]).toEqual({
			title: 'Module 1',
			action: 'addCodeBlockBySlug',
			payload: { codeBlockSlug: 'mod1' },
			close: true,
		});
	});

	it('should return child categories and items for a parent category', async () => {
		const modules: ModuleMetadata[] = [
			{ slug: 'mod1', title: 'Module 1', category: 'Effects/Time' },
			{ slug: 'mod2', title: 'Module 2', category: 'Effects/Distortion' },
			{ slug: 'mod3', title: 'Module 3', category: 'Effects' },
		];

		(mockState.callbacks.getListOfModules as ReturnType<typeof vi.fn>).mockResolvedValue(modules);

		const menu = await builtInModuleMenu(mockState, { categoryPath: 'Effects' });

		expect(menu).toHaveLength(3);
		expect(menu[0].title).toBe('Distortion');
		expect(menu[0].action).toBe('openSubMenu');
		expect(menu[1].title).toBe('Time');
		expect(menu[1].action).toBe('openSubMenu');
		expect(menu[2].title).toBe('Module 3');
		expect(menu[2].action).toBe('addCodeBlockBySlug');
	});

	it('should return empty array for non-existent category path', async () => {
		const modules: ModuleMetadata[] = [{ slug: 'mod1', title: 'Module 1', category: 'Effects' }];

		(mockState.callbacks.getListOfModules as ReturnType<typeof vi.fn>).mockResolvedValue(modules);

		const menu = await builtInModuleMenu(mockState, { categoryPath: 'NonExistent' });

		expect(menu).toHaveLength(0);
	});
});

describe('projectCategoriesMenu', () => {
	it('should create flat menu for projects without nested categories', async () => {
		const projects: ProjectMetadata[] = [
			{ slug: 'proj1', title: 'Project 1', description: '', category: 'Audio' },
			{ slug: 'proj2', title: 'Project 2', description: '', category: 'Visual' },
		];

		(mockState.callbacks.getListOfProjects as ReturnType<typeof vi.fn>).mockResolvedValue(projects);

		const menu = await projectCategoriesMenu(mockState);

		expect(menu).toHaveLength(2);
		expect(menu[0]).toEqual({
			title: 'Audio',
			action: 'openSubMenu',
			payload: { menu: 'projectMenu', categoryPath: 'Audio' },
			close: false,
		});
	});

	it('should create nested menu for projects with slash-delimited categories', async () => {
		const projects: ProjectMetadata[] = [
			{ slug: 'proj1', title: 'Project 1', description: '', category: 'MIDI/Instruments' },
			{ slug: 'proj2', title: 'Project 2', description: '', category: 'MIDI/Rhythm' },
			{ slug: 'proj3', title: 'Project 3', description: '', category: 'Audio' },
		];

		(mockState.callbacks.getListOfProjects as ReturnType<typeof vi.fn>).mockResolvedValue(projects);

		const menu = await projectCategoriesMenu(mockState);

		expect(menu).toHaveLength(2);
		expect(menu[0]).toEqual({
			title: 'Audio',
			action: 'openSubMenu',
			payload: { menu: 'projectMenu', categoryPath: 'Audio' },
			close: false,
		});
		expect(menu[1]).toEqual({
			title: 'MIDI',
			action: 'openSubMenu',
			payload: { menu: 'projectCategoriesMenu', categoryPath: 'MIDI' },
			close: false,
		});
	});

	it('should navigate to nested category when categoryPath is provided', async () => {
		const projects: ProjectMetadata[] = [
			{ slug: 'proj1', title: 'Project 1', description: '', category: 'MIDI/Instruments' },
			{ slug: 'proj2', title: 'Project 2', description: '', category: 'MIDI/Rhythm' },
		];

		(mockState.callbacks.getListOfProjects as ReturnType<typeof vi.fn>).mockResolvedValue(projects);

		const menu = await projectCategoriesMenu(mockState, { categoryPath: 'MIDI' });

		expect(menu).toHaveLength(2);
		expect(menu[0].title).toBe('Instruments');
		expect(menu[1].title).toBe('Rhythm');
	});
});

describe('projectMenu', () => {
	it('should return projects for a given category path', async () => {
		const projects: ProjectMetadata[] = [
			{ slug: 'proj1', title: 'Project 1', description: '', category: 'MIDI/Instruments' },
			{ slug: 'proj2', title: 'Project 2', description: '', category: 'Audio' },
		];

		(mockState.callbacks.getListOfProjects as ReturnType<typeof vi.fn>).mockResolvedValue(projects);

		const menu = await projectMenu(mockState, { categoryPath: 'MIDI/Instruments' });

		expect(menu).toHaveLength(1);
		expect(menu[0]).toEqual({
			title: 'Project 1',
			action: 'loadProjectBySlug',
			payload: { projectSlug: 'proj1' },
			close: true,
		});
	});

	it('should return all projects when no categoryPath is provided', async () => {
		const projects: ProjectMetadata[] = [
			{ slug: 'proj1', title: 'Project 1', description: '', category: 'Audio' },
			{ slug: 'proj2', title: 'Project 2', description: '', category: 'Visual' },
		];

		(mockState.callbacks.getListOfProjects as ReturnType<typeof vi.fn>).mockResolvedValue(projects);

		const menu = await projectMenu(mockState);

		expect(menu).toHaveLength(2);
		expect(menu[0].title).toBe('Project 1');
		expect(menu[1].title).toBe('Project 2');
	});

	it('should handle projects without categories', async () => {
		const projects: ProjectMetadata[] = [
			{ slug: 'proj1', title: 'Project 1', description: '' },
			{ slug: 'proj2', title: 'Project 2', description: '' },
		];

		(mockState.callbacks.getListOfProjects as ReturnType<typeof vi.fn>).mockResolvedValue(projects);

		const menu = await projectMenu(mockState);

		expect(menu).toHaveLength(2);
	});
});
