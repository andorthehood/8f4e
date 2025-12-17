import { describe, it, expect, vi } from 'vitest';

import { moduleCategoriesMenu, projectCategoriesMenu } from './menus';

import type { State, ModuleMetadata, ProjectMetadata } from '../../types';

describe('nested menu generation', () => {
	describe('moduleCategoriesMenu', () => {
		it('should generate top-level categories for modules', async () => {
			const mockModules: ModuleMetadata[] = [
				{ slug: 'sine', title: 'Sine', category: 'Functions/Trigonometric' },
				{ slug: 'sigmoid', title: 'Sigmoid', category: 'Functions/Activation' },
				{ slug: 'audio1', title: 'Audio 1', category: 'Audio' },
			];

			const mockState = {
				callbacks: {
					getListOfModules: vi.fn().mockResolvedValue(mockModules),
				},
			} as unknown as State;

			const result = await moduleCategoriesMenu(mockState, {});

			// Should have two top-level items: Audio and Functions
			expect(result).toHaveLength(2);
			expect(result[0].title).toBe('Audio');
			expect(result[0].action).toBe('openSubMenu');
			expect(result[1].title).toBe('Functions');
			expect(result[1].action).toBe('openSubMenu');
		});

		it('should generate nested submenus for slash-delimited categories', async () => {
			const mockModules: ModuleMetadata[] = [
				{ slug: 'sine', title: 'Sine', category: 'Functions/Trigonometric' },
				{ slug: 'sigmoid', title: 'Sigmoid', category: 'Functions/Activation' },
			];

			const mockState = {
				callbacks: {
					getListOfModules: vi.fn().mockResolvedValue(mockModules),
				},
			} as unknown as State;

			// Navigate to Functions submenu
			const functionsMenu = await moduleCategoriesMenu(mockState, { categoryPath: 'Functions' });

			// Should have two subcategories
			expect(functionsMenu).toHaveLength(2);
			expect(functionsMenu[0].title).toBe('Activation');
			expect(functionsMenu[0].action).toBe('openSubMenu');
			expect(functionsMenu[1].title).toBe('Trigonometric');
			expect(functionsMenu[1].action).toBe('openSubMenu');
		});

		it('should generate leaf items (modules) at the deepest level', async () => {
			const mockModules: ModuleMetadata[] = [
				{ slug: 'sine', title: 'Sine', category: 'Functions/Trigonometric' },
				{ slug: 'cosine', title: 'Cosine', category: 'Functions/Trigonometric' },
			];

			const mockState = {
				callbacks: {
					getListOfModules: vi.fn().mockResolvedValue(mockModules),
				},
			} as unknown as State;

			// Navigate to Functions/Trigonometric
			const trigMenu = await moduleCategoriesMenu(mockState, { categoryPath: 'Functions/Trigonometric' });

			// Should have two module items
			expect(trigMenu).toHaveLength(2);
			expect(trigMenu[0].title).toBe('Cosine');
			expect(trigMenu[0].action).toBe('addCodeBlockBySlug');
			expect(trigMenu[0].close).toBe(true);
			expect(trigMenu[1].title).toBe('Sine');
		});

		it('should handle flat categories without nesting', async () => {
			const mockModules: ModuleMetadata[] = [
				{ slug: 'audio1', title: 'Audio 1', category: 'Audio' },
				{ slug: 'audio2', title: 'Audio 2', category: 'Audio' },
			];

			const mockState = {
				callbacks: {
					getListOfModules: vi.fn().mockResolvedValue(mockModules),
				},
			} as unknown as State;

			// Get top-level menu
			const topMenu = await moduleCategoriesMenu(mockState, {});
			expect(topMenu).toHaveLength(1);
			expect(topMenu[0].title).toBe('Audio');

			// Navigate to Audio category
			const audioMenu = await moduleCategoriesMenu(mockState, { categoryPath: 'Audio' });
			expect(audioMenu).toHaveLength(2);
			expect(audioMenu[0].title).toBe('Audio 1');
			expect(audioMenu[0].action).toBe('addCodeBlockBySlug');
		});

		it('should sort categories and items alphabetically', async () => {
			const mockModules: ModuleMetadata[] = [
				{ slug: 'z', title: 'Zebra', category: 'Z' },
				{ slug: 'a', title: 'Apple', category: 'A' },
				{ slug: 'b', title: 'Banana', category: 'A' },
			];

			const mockState = {
				callbacks: {
					getListOfModules: vi.fn().mockResolvedValue(mockModules),
				},
			} as unknown as State;

			const topMenu = await moduleCategoriesMenu(mockState, {});
			expect(topMenu[0].title).toBe('A');
			expect(topMenu[1].title).toBe('Z');

			const aMenu = await moduleCategoriesMenu(mockState, { categoryPath: 'A' });
			expect(aMenu[0].title).toBe('Apple');
			expect(aMenu[1].title).toBe('Banana');
		});
	});

	describe('projectCategoriesMenu', () => {
		it('should generate top-level categories for projects', async () => {
			const mockProjects: ProjectMetadata[] = [
				{ slug: 'audio1', title: 'Audio Project', description: '', category: 'Audio' },
				{ slug: 'midi1', title: 'MIDI Project', description: '', category: 'MIDI' },
			];

			const mockState = {
				callbacks: {
					getListOfProjects: vi.fn().mockResolvedValue(mockProjects),
					getProject: vi.fn(),
				},
			} as unknown as State;

			const result = await projectCategoriesMenu(mockState, {});

			expect(result).toHaveLength(2);
			expect(result[0].title).toBe('Audio');
			expect(result[1].title).toBe('MIDI');
		});

		it('should generate leaf items (projects) at category level', async () => {
			const mockProjects: ProjectMetadata[] = [
				{ slug: 'audio1', title: 'Audio Project 1', description: '', category: 'Audio' },
				{ slug: 'audio2', title: 'Audio Project 2', description: '', category: 'Audio' },
			];

			const mockState = {
				callbacks: {
					getListOfProjects: vi.fn().mockResolvedValue(mockProjects),
					getProject: vi.fn(),
				},
			} as unknown as State;

			const audioMenu = await projectCategoriesMenu(mockState, { categoryPath: 'Audio' });

			expect(audioMenu).toHaveLength(2);
			expect(audioMenu[0].title).toBe('Audio Project 1');
			expect(audioMenu[0].action).toBe('loadProjectBySlug');
			expect(audioMenu[0].payload).toEqual({ projectSlug: 'audio1' });
		});

		it('should handle nested project categories', async () => {
			const mockProjects: ProjectMetadata[] = [
				{ slug: 'synth1', title: 'Synth 1', description: '', category: 'Audio/Synthesis' },
				{ slug: 'synth2', title: 'Synth 2', description: '', category: 'Audio/Synthesis' },
			];

			const mockState = {
				callbacks: {
					getListOfProjects: vi.fn().mockResolvedValue(mockProjects),
					getProject: vi.fn(),
				},
			} as unknown as State;

			const topMenu = await projectCategoriesMenu(mockState, {});
			expect(topMenu).toHaveLength(1);
			expect(topMenu[0].title).toBe('Audio');

			const audioMenu = await projectCategoriesMenu(mockState, { categoryPath: 'Audio' });
			expect(audioMenu).toHaveLength(1);
			expect(audioMenu[0].title).toBe('Synthesis');

			const synthMenu = await projectCategoriesMenu(mockState, { categoryPath: 'Audio/Synthesis' });
			expect(synthMenu).toHaveLength(2);
			expect(synthMenu[0].title).toBe('Synth 1');
		});
	});
});
