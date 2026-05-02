import { describe, expect, it, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import contextMenu from './effect';

import type { State } from '@8f4e/editor-state-types';

import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import { createMockState } from '~/pureHelpers/testingUtils/testUtils';

describe('contextMenu effect', () => {
	it('anchors the menu in world coordinates and hit-tests it after viewport movement', async () => {
		const state = createMockState({
			viewport: {
				x: 24,
				y: 48,
				vGrid: 8,
				hGrid: 16,
			},
		});
		const store = createStateManager(state as State);
		const events = createMockEventDispatcherWithVitest();

		contextMenu(store, events);

		const onCalls = (events.on as unknown as MockInstance).mock.calls;
		const onContextMenu = onCalls.find(call => call[0] === 'contextmenu')![1];

		await onContextMenu({ x: 100, y: 112 });

		expect(state.graphicHelper.contextMenu.x).toBe(128);
		expect(state.graphicHelper.contextMenu.y).toBe(160);

		state.viewport.x = 32;
		state.viewport.y = 64;

		const onMouseMove = (events.on as unknown as MockInstance).mock.calls.find(call => call[0] === 'mousemove')![1];
		onMouseMove({ x: 96, y: 112 });

		expect(state.graphicHelper.contextMenu.highlightedItem).toBe(1);
	});
});
