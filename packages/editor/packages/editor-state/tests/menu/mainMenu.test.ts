import { describe, it, expect } from 'vitest';

import { mainMenu } from '../../src/features/menu/menus';
import { createMockState } from '../../src/pureHelpers/testingUtils/testUtils';

import type { State } from '../../src/types';

describe('menus - go home entry', () => {
	it('places "Go @home" directly above "Jump to..."', () => {
		const mockState = createMockState({
			featureFlags: { editing: true },
		});

		const menu = mainMenu(mockState as State);

		const goHomeIndex = menu.findIndex(item => item.title === 'Go @home');
		const jumpToIndex = menu.findIndex(item => item.title === 'Jump to...');

		expect(goHomeIndex).toBeGreaterThanOrEqual(0);
		expect(jumpToIndex).toBe(goHomeIndex + 1);
	});

	it('shows "Go @home" even when no home block exists', () => {
		const mockState = createMockState({
			featureFlags: { editing: true },
			graphicHelper: { codeBlocks: [] },
		});

		const menu = mainMenu(mockState as State);

		const goHomeItem = menu.find(item => item.title === 'Go @home');

		expect(goHomeItem).toBeDefined();
		expect(goHomeItem?.disabled).toBeUndefined();
	});

	it('shows "Jump to..." in view mode when editing is disabled', () => {
		const mockState = createMockState({
			featureFlags: { editing: false },
		});

		const menu = mainMenu(mockState as State);
		const jumpToItem = menu.find(item => item.title === 'Jump to...');

		expect(jumpToItem).toBeDefined();
		expect(jumpToItem?.action).toBe('openSubMenu');
	});
});
