import { describe, expect, it, type MockInstance } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import dialog from './effect';

import type { State } from '@8f4e/editor-state-types';

import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('dialog effect', () => {
	function setup(state: State) {
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		dialog(store, events);

		const onResize = (events.on as unknown as MockInstance).mock.calls.find(
			call => call[0] === 'resize'
		)![1] as () => void;

		return { onResize };
	}

	it('uses the minimum dialog width when half the viewport is too narrow', () => {
		const state = createMockState({
			viewport: {
				width: 640,
				height: 768,
				vGrid: 8,
				hGrid: 16,
			},
		});
		const { onResize } = setup(state);

		onResize();

		expect(state.dialog.width).toBe(512);
		expect(state.dialog.height).toBe(96);
		expect(state.dialog.x).toBe(64);
		expect(state.dialog.y).toBe(336);
	});

	it('sizes the dialog to half the viewport between the minimum and maximum width', () => {
		const state = createMockState({
			viewport: {
				width: 1280,
				height: 768,
				vGrid: 8,
				hGrid: 16,
			},
		});
		const { onResize } = setup(state);

		onResize();

		expect(state.dialog.width).toBe(640);
		expect(state.dialog.height).toBe(96);
		expect(state.dialog.x).toBe(320);
		expect(state.dialog.y).toBe(336);
	});

	it('caps the dialog width at 96 grid cells', () => {
		const state = createMockState({
			dialog: {
				text: 'a'.repeat(300),
			},
			viewport: {
				width: 5200,
				height: 768,
				vGrid: 8,
				hGrid: 16,
			},
		});
		const { onResize } = setup(state);

		onResize();

		expect(state.dialog.width).toBe(768);
		expect(state.dialog.height).toBe(144);
		expect(state.dialog.x).toBe(2216);
		expect(state.dialog.y).toBe(320);
		expect(state.dialog.wrappedText[0]).toHaveLength(94);
	});
});
