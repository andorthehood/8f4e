import type { State } from '@8f4e/editor-state-types';
import { describe, expect, it } from 'vitest';
import { mainMenu } from '../../src/features/menu/menus';
import { createMockState } from '../../src/pureHelpers/testingUtils/testUtils';

describe('menus - go home entry', () => {
	it('places "Go @home" directly above "Jump to..."', () => {
		const mockState = createMockState({
			editorMode: 'edit',
		});

		const menu = mainMenu(mockState as State);

		const goHomeIndex = menu.findIndex(item => item.title === 'Go @home');
		const jumpToIndex = menu.findIndex(item => item.title === 'Jump to...');

		expect(goHomeIndex).toBeGreaterThanOrEqual(0);
		expect(jumpToIndex).toBe(goHomeIndex + 1);
	});

	it('shows "Go @home" even when no home block exists', () => {
		const mockState = createMockState({
			editorMode: 'edit',
			graphicHelper: { codeBlocks: [] },
		});

		const menu = mainMenu(mockState as State);

		const goHomeItem = menu.find(item => item.title === 'Go @home');

		expect(goHomeItem).toBeDefined();
		expect(goHomeItem?.disabled).toBeUndefined();
	});

	it('shows "Jump to..." in view mode when editing is disabled', () => {
		const mockState = createMockState({
			editorMode: 'view',
			featureFlags: { editing: false },
		});

		const menu = mainMenu(mockState as State);
		const jumpToItem = menu.find(item => item.title === 'Jump to...');

		expect(jumpToItem).toBeDefined();
		expect(jumpToItem?.action).toBe('openSubMenu');
	});

	it('shows "New Note" when editing is enabled', () => {
		const mockState = createMockState({
			editorMode: 'edit',
		});

		const menu = mainMenu(mockState as State);
		const newNoteItem = menu.find(item => item.title === 'New Note');

		expect(newNoteItem).toBeDefined();
		expect(newNoteItem?.action).toBe('addCodeBlock');
		expect(newNoteItem?.payload).toEqual({ isNew: true, blockType: 'note' });
	});

	it('uses "New Module" as the module creation action', () => {
		const mockState = createMockState({
			editorMode: 'edit',
		});

		const menu = mainMenu(mockState as State);
		const newModuleItem = menu.find(item => item.title === 'New Module');

		expect(newModuleItem).toBeDefined();
		expect(newModuleItem?.action).toBe('addCodeBlock');
		expect(newModuleItem?.payload).toEqual({ isNew: true, blockType: 'module' });
		expect(menu.find(item => item.title === 'New Entry')).toBeUndefined();
	});

	it('hides "New Module" when editing is disabled', () => {
		const mockState = createMockState({
			editorMode: 'view',
			featureFlags: { editing: false },
		});

		const menu = mainMenu(mockState as State);
		const newModuleItem = menu.find(item => item.title === 'New Module');

		expect(newModuleItem).toBeUndefined();
	});

	it('shows "Take Screenshot" when canvas screenshot export is available', () => {
		const mockState = createMockState({
			callbacks: { exportCanvasScreenshot: async () => {} },
		});

		const menu = mainMenu(mockState as State);
		const screenshotItem = menu.find(item => item.title === 'Take Screenshot');

		expect(screenshotItem).toBeDefined();
		expect(screenshotItem?.action).toBe('exportCanvasScreenshot');
		expect(screenshotItem?.disabled).toBe(false);
	});

	it('disables "Take Screenshot" when canvas screenshot export is unavailable', () => {
		const mockState = createMockState({
			callbacks: { exportCanvasScreenshot: undefined },
		});

		const menu = mainMenu(mockState as State);
		const screenshotItem = menu.find(item => item.title === 'Take Screenshot');

		expect(screenshotItem).toBeDefined();
		expect(screenshotItem?.disabled).toBe(true);
	});
});
