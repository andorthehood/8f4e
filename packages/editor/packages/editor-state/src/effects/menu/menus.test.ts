import { describe, it, expect } from 'vitest';

import { mainMenu, moduleMenu } from './menus';

import { createMockState, createMockCodeBlock } from '../../pureHelpers/testingUtils/testUtils';

import type { State } from '../../types';

describe('menus - clipboard callback disabled state', () => {
	describe('mainMenu', () => {
		it('should disable "Paste Module" when readClipboardText is not provided', () => {
			const mockState = createMockState({
				featureFlags: { editing: true },
				callbacks: { readClipboardText: undefined },
			});

			const menu = mainMenu(mockState as State);

			const pasteModuleItem = menu.find(item => item.title === 'Paste Module');
			expect(pasteModuleItem).toBeDefined();
			expect(pasteModuleItem?.disabled).toBe(true);
		});

		it('should enable "Paste Module" when readClipboardText is provided', () => {
			const mockState = createMockState({
				featureFlags: { editing: true },
				callbacks: { readClipboardText: async () => 'test' },
			});

			const menu = mainMenu(mockState as State);

			const pasteModuleItem = menu.find(item => item.title === 'Paste Module');
			expect(pasteModuleItem).toBeDefined();
			expect(pasteModuleItem?.disabled).toBe(false);
		});

		it('should not show "Paste Module" when editing is disabled', () => {
			const mockState = createMockState({
				featureFlags: { editing: false },
			});

			const menu = mainMenu(mockState as State);

			const pasteModuleItem = menu.find(item => item.title === 'Paste Module');
			expect(pasteModuleItem).toBeUndefined();
		});
	});

	describe('moduleMenu', () => {
		it('should disable "Copy" menu item when writeClipboardText is not provided', () => {
			const mockCodeBlock = createMockCodeBlock({ id: 'test', blockType: 'module' });
			const mockState = createMockState({
				callbacks: { writeClipboardText: undefined },
				graphicHelper: { selectedCodeBlock: mockCodeBlock },
			});

			const menu = moduleMenu(mockState as State);

			const copyItem = menu.find(item => item.title === 'Copy module');
			expect(copyItem).toBeDefined();
			expect(copyItem?.disabled).toBe(true);
		});

		it('should enable "Copy" menu item when writeClipboardText is provided', () => {
			const mockCodeBlock = createMockCodeBlock({ id: 'test', blockType: 'module' });
			const mockState = createMockState({
				callbacks: { writeClipboardText: async () => {} },
				graphicHelper: { selectedCodeBlock: mockCodeBlock },
			});

			const menu = moduleMenu(mockState as State);

			const copyItem = menu.find(item => item.title === 'Copy module');
			expect(copyItem).toBeDefined();
			expect(copyItem?.disabled).toBe(false);
		});

		it('should show correct label for function block type', () => {
			const mockCodeBlock = createMockCodeBlock({ id: 'test', blockType: 'function' });
			const mockState = createMockState({
				callbacks: { writeClipboardText: undefined },
				graphicHelper: { selectedCodeBlock: mockCodeBlock },
			});

			const menu = moduleMenu(mockState as State);

			const copyItem = menu.find(item => item.title === 'Copy function');
			expect(copyItem).toBeDefined();
			expect(copyItem?.disabled).toBe(true);
		});

		it('should show correct label for vertex shader block type', () => {
			const mockCodeBlock = createMockCodeBlock({ id: 'test', blockType: 'vertexShader' });
			const mockState = createMockState({
				callbacks: { writeClipboardText: undefined },
				graphicHelper: { selectedCodeBlock: mockCodeBlock },
			});

			const menu = moduleMenu(mockState as State);

			const copyItem = menu.find(item => item.title === 'Copy vertex shader');
			expect(copyItem).toBeDefined();
			expect(copyItem?.disabled).toBe(true);
		});

		it('should show correct label for fragment shader block type', () => {
			const mockCodeBlock = createMockCodeBlock({ id: 'test', blockType: 'fragmentShader' });
			const mockState = createMockState({
				callbacks: { writeClipboardText: undefined },
				graphicHelper: { selectedCodeBlock: mockCodeBlock },
			});

			const menu = moduleMenu(mockState as State);

			const copyItem = menu.find(item => item.title === 'Copy fragment shader');
			expect(copyItem).toBeDefined();
			expect(copyItem?.disabled).toBe(true);
		});
	});
});
