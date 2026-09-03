import type { InternalMouseEvent, State } from '@8f4e/editor-state-types';
import createStateManager from '@8f4e/state-manager';
import { describe, expect, it, type MockInstance } from 'vitest';
import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import dialog from './effect';

describe('dialog effect', () => {
	function setup(state: State) {
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		dialog(store, events);

		const onResize = (events.on as unknown as MockInstance).mock.calls.find(
			call => call[0] === 'resize'
		)![1] as () => void;

		function emit<T>(eventName: string, event?: T) {
			const callback = (events.on as unknown as MockInstance).mock.calls.find(call => call[0] === eventName)![1] as (
				event?: T
			) => void;
			callback(event);
		}

		return { emit, events, onResize };
	}

	it('uses the minimum dialog width when half the viewport is too narrow', () => {
		const state = createMockState({
			dialogStack: [
				{
					id: 'test-dialog',
					text: 'Short text',
					title: 'Test Dialog',
					buttons: [],
				},
			],
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
			dialogStack: [
				{
					id: 'test-dialog',
					text: 'Short text',
					title: 'Test Dialog',
					buttons: [],
				},
			],
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
			dialogStack: [
				{
					id: 'test-dialog',
					text: 'a'.repeat(300),
					title: 'Test Dialog',
					buttons: [],
				},
			],
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

	it('renders only the top dialog from the stack', () => {
		const state = createMockState({
			viewport: {
				width: 1280,
				height: 768,
				vGrid: 8,
				hGrid: 16,
			},
		});
		const { emit } = setup(state);

		emit('addDialog', {
			id: 'first-dialog',
			text: 'First',
			title: 'First Dialog',
			buttons: [],
		});

		expect(state.dialog.id).toBe('first-dialog');
		expect(state.dialog.title).toBe('First Dialog');

		emit('addDialog', {
			id: 'second-dialog',
			text: 'Second',
			title: 'Second Dialog',
			buttons: [],
		});

		expect(state.dialog.id).toBe('second-dialog');
		expect(state.dialog.title).toBe('Second Dialog');

		emit('removeDialog', { id: 'second-dialog' });

		expect(state.dialog.id).toBe('first-dialog');
		expect(state.dialog.title).toBe('First Dialog');

		emit('removeDialog', 'first-dialog');

		expect(state.dialogStack).toEqual([]);
		expect(state.dialog.id).toBe('');
	});

	it('lays out and activates dialog buttons while blocking pointer propagation', () => {
		const state = createMockState({
			dialogStack: [
				{
					id: 'confirmation',
					text: 'Continue?',
					title: 'Confirm',
					buttons: [{ title: 'Cancel' }, { title: 'Grant', action: 'confirmAction', payload: { id: 42 } }],
				},
			],
			viewport: {
				width: 1280,
				height: 768,
				vGrid: 8,
				hGrid: 16,
			},
		});
		const { emit, events } = setup(state);

		expect(state.dialog.height).toBe(112);
		expect(state.dialog.buttons).toEqual([
			{ title: 'Cancel', x: 504, y: 80, width: 64, height: 16 },
			{ title: 'Grant', action: 'confirmAction', payload: { id: 42 }, x: 576, y: 80, width: 56, height: 16 },
		]);

		const pointerEvent: InternalMouseEvent = {
			x: state.dialog.x + state.dialog.buttons[1].x + 1,
			y: state.dialog.y + state.dialog.buttons[1].y + 1,
			movementX: 0,
			movementY: 0,
			buttons: 1,
			stopPropagation: false,
			canvasWidth: 1280,
			canvasHeight: 768,
			altKey: false,
		};

		emit('mousemove', pointerEvent);
		expect(state.dialog.highlightedButton).toBe(1);
		expect(pointerEvent.stopPropagation).toBe(true);

		pointerEvent.stopPropagation = false;
		emit('mousedown', pointerEvent);

		expect(pointerEvent.stopPropagation).toBe(true);
		expect(state.dialogStack).toEqual([]);
		expect(events.dispatch).toHaveBeenCalledWith('confirmAction', { id: 42 });
	});

	it('blocks clicks outside dialog buttons without closing the dialog', () => {
		const state = createMockState({
			dialogStack: [
				{
					id: 'loading',
					text: 'Please wait',
					title: 'Loading',
					buttons: [],
				},
			],
		});
		const { emit, events } = setup(state);
		const pointerEvent = {
			x: 0,
			y: 0,
			stopPropagation: false,
		} as InternalMouseEvent;

		emit('mousedown', pointerEvent);

		expect(pointerEvent.stopPropagation).toBe(true);
		expect(state.dialogStack).toHaveLength(1);
		expect(events.dispatch).not.toHaveBeenCalled();
	});

	it('keeps the dialog open when a button opts out of closing it', () => {
		const state = createMockState({
			dialogStack: [
				{
					id: 'retry-dialog',
					text: 'Try again?',
					title: 'Retry',
					buttons: [{ title: 'Retry', action: 'retryAction', close: false }],
				},
			],
		});
		const { emit, events } = setup(state);
		const button = state.dialog.buttons[0];
		const pointerEvent = {
			x: state.dialog.x + button.x + 1,
			y: state.dialog.y + button.y + 1,
			stopPropagation: false,
		} as InternalMouseEvent;

		emit('mousedown', pointerEvent);

		expect(state.dialogStack).toHaveLength(1);
		expect(events.dispatch).toHaveBeenCalledWith('retryAction', undefined);
	});
});
