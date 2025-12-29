import { describe, it, expect, beforeEach } from 'vitest';

import { moduleCategoriesMenu, projectMenu } from './menus';

import { createMockState } from '../../pureHelpers/testingUtils/testUtils';

import type { State, ModuleMetadata, ProjectMetadata, Project } from '../../types';

describe('menus - nested categories', () => {
	let mockState: State;

	beforeEach(() => {
		mockState = createMockState();
	});

	describe('moduleCategoriesMenu', () => {
		it('should show top-level categories for flat structure', async () => {
			const modules: ModuleMetadata[] = [
				{ slug: 'mod1', title: 'Module 1', category: 'CategoryA' },
				{ slug: 'mod2', title: 'Module 2', category: 'CategoryB' },
			];

			mockState.callbacks.getListOfModules = async () => modules;

			const items = await moduleCategoriesMenu(mockState);

			expect(items.length).toBe(2);
			expect(items[0].title).toBe('CategoryA');
			expect(items[0].action).toBe('openSubMenu');
			expect(items[1].title).toBe('CategoryB');
		});

		it('should show nested categories and items at root level', async () => {
			const modules: ModuleMetadata[] = [
				{ slug: 'mod1', title: 'Module 1', category: 'Parent/Child' },
				{ slug: 'mod2', title: 'Module 2', category: 'Other' },
			];

			mockState.callbacks.getListOfModules = async () => modules;

			const items = await moduleCategoriesMenu(mockState);

			expect(items.length).toBe(2);
			expect(items[0].title).toBe('Other');
			expect(items[0].action).toBe('openSubMenu');
			expect(items[1].title).toBe('Parent');
			expect(items[1].action).toBe('openSubMenu');
		});

		it('should navigate to nested category', async () => {
			const modules: ModuleMetadata[] = [
				{ slug: 'mod1', title: 'Module 1', category: 'Parent/Child1' },
				{ slug: 'mod2', title: 'Module 2', category: 'Parent/Child2' },
			];

			mockState.callbacks.getListOfModules = async () => modules;

			const items = await moduleCategoriesMenu(mockState, { categoryPath: 'Parent' });

			expect(items.length).toBe(2);
			expect(items[0].title).toBe('Child1');
			expect(items[0].action).toBe('openSubMenu');
			expect(items[1].title).toBe('Child2');
		});

		it('should show items in leaf category', async () => {
			const modules: ModuleMetadata[] = [
				{ slug: 'mod1', title: 'Module 1', category: 'Parent/Child' },
				{ slug: 'mod2', title: 'Module 2', category: 'Parent/Child' },
			];

			mockState.callbacks.getListOfModules = async () => modules;

			const items = await moduleCategoriesMenu(mockState, { categoryPath: 'Parent/Child' });

			expect(items.length).toBe(2);
			expect(items[0].title).toBe('Module 1');
			expect(items[0].action).toBe('addCodeBlockBySlug');
			expect(items[0].payload).toEqual({ codeBlockSlug: 'mod1' });
			expect(items[1].title).toBe('Module 2');
		});

		it('should sort categories and items alphabetically', async () => {
			const modules: ModuleMetadata[] = [
				{ slug: 'mod1', title: 'Zebra Module', category: 'CategoryZ' },
				{ slug: 'mod2', title: 'Apple Module', category: 'CategoryA' },
				{ slug: 'mod3', title: 'Mango Module', category: 'CategoryZ' },
			];

			mockState.callbacks.getListOfModules = async () => modules;

			const rootItems = await moduleCategoriesMenu(mockState);

			expect(rootItems[0].title).toBe('CategoryA');
			expect(rootItems[1].title).toBe('CategoryZ');

			const categoryZItems = await moduleCategoriesMenu(mockState, { categoryPath: 'CategoryZ' });

			expect(categoryZItems[0].title).toBe('Mango Module');
			expect(categoryZItems[1].title).toBe('Zebra Module');
		});

		it('should handle missing category with default', async () => {
			const modules: ModuleMetadata[] = [
				{ slug: 'mod1', title: 'Module 1', category: 'CategoryA' },
				{ slug: 'mod2', title: 'Module 2' } as ModuleMetadata,
			];

			mockState.callbacks.getListOfModules = async () => modules;

			const items = await moduleCategoriesMenu(mockState);

			expect(items.some(item => item.title === 'CategoryA')).toBe(true);
			expect(items.some(item => item.title === 'Uncategorized')).toBe(true);
		});

		it('should return empty array when callback not available', async () => {
			mockState.callbacks.getListOfModules = undefined;

			const items = await moduleCategoriesMenu(mockState);

			expect(items).toEqual([]);
		});

		it('should handle deeply nested paths', async () => {
			const modules: ModuleMetadata[] = [{ slug: 'mod1', title: 'Module 1', category: 'A/B/C/D' }];

			mockState.callbacks.getListOfModules = async () => modules;

			const levelA = await moduleCategoriesMenu(mockState);
			expect(levelA[0].title).toBe('A');

			const levelB = await moduleCategoriesMenu(mockState, { categoryPath: 'A' });
			expect(levelB[0].title).toBe('B');

			const levelC = await moduleCategoriesMenu(mockState, { categoryPath: 'A/B' });
			expect(levelC[0].title).toBe('C');

			const levelD = await moduleCategoriesMenu(mockState, { categoryPath: 'A/B/C' });
			expect(levelD[0].title).toBe('D');

			const leaf = await moduleCategoriesMenu(mockState, { categoryPath: 'A/B/C/D' });
			expect(leaf[0].title).toBe('Module 1');
		});
	});

	describe('projectMenu', () => {
		it('should show top-level categories for flat structure', async () => {
			const projects: ProjectMetadata[] = [
				{ slug: 'proj1', title: 'Project 1', description: '', category: 'CategoryA' },
				{ slug: 'proj2', title: 'Project 2', description: '', category: 'CategoryB' },
			];

			mockState.callbacks.getListOfProjects = async () => projects;
			mockState.callbacks.getProject = async () => ({}) as Project;

			const items = await projectMenu(mockState);

			expect(items.length).toBe(2);
			expect(items[0].title).toBe('CategoryA');
			expect(items[0].action).toBe('openSubMenu');
			expect(items[1].title).toBe('CategoryB');
		});

		it('should show nested categories', async () => {
			const projects: ProjectMetadata[] = [
				{ slug: 'proj1', title: 'Project 1', description: '', category: 'Music/MIDI' },
				{ slug: 'proj2', title: 'Project 2', description: '', category: 'Graphics/Demos' },
			];

			mockState.callbacks.getListOfProjects = async () => projects;
			mockState.callbacks.getProject = async () => ({}) as Project;

			const items = await projectMenu(mockState);

			expect(items.some(item => item.title === 'Graphics')).toBe(true);
			expect(items.some(item => item.title === 'Music')).toBe(true);
		});

		it('should navigate to nested project category', async () => {
			const projects: ProjectMetadata[] = [
				{ slug: 'proj1', title: 'Project 1', description: '', category: 'Music/MIDI' },
			];

			mockState.callbacks.getListOfProjects = async () => projects;
			mockState.callbacks.getProject = async () => ({}) as Project;

			const items = await projectMenu(mockState, { categoryPath: 'Music' });

			expect(items.length).toBe(1);
			expect(items[0].title).toBe('MIDI');
		});

		it('should show project items in leaf category', async () => {
			const projects: ProjectMetadata[] = [
				{ slug: 'proj1', title: 'Project 1', description: '', category: 'Music/MIDI' },
			];

			mockState.callbacks.getListOfProjects = async () => projects;
			mockState.callbacks.getProject = async () => ({}) as Project;

			const items = await projectMenu(mockState, { categoryPath: 'Music/MIDI' });

			expect(items.length).toBe(1);
			expect(items[0].title).toBe('Project 1');
			expect(items[0].action).toBe('loadProjectBySlug');
			expect(items[0].payload).toEqual({ projectSlug: 'proj1' });
		});

		it('should return empty array when callbacks not available', async () => {
			mockState.callbacks.getListOfProjects = undefined;

			const items = await projectMenu(mockState);

			expect(items).toEqual([]);
		});
	});
});
