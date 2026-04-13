import { describe, it, expect, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import editorConfigModule from './effect';

import { EMPTY_DEFAULT_PROJECT } from '~/types';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';

describe('editor config block placement', () => {
	it('moves a colliding editor config block to the first free y position for its x span', async () => {
		const existingTopBlock = createMockCodeBlock({
			id: 'top',
			gridX: 0,
			gridY: 0,
			width: 32 * 8,
			height: 4 * 16,
			code: ['module top', 'moduleEnd'],
		});
		const existingBottomBlock = createMockCodeBlock({
			id: 'bottom',
			gridX: 0,
			gridY: 8,
			width: 32 * 8,
			height: 3 * 16,
			code: ['module bottom', 'moduleEnd'],
		});
		const loadEditorConfigBlocks = vi.fn(async () => [
			{
				code: ['module editorConfig', '; config', 'moduleEnd'],
				gridCoordinates: { x: 0, y: 0 },
			},
		]);
		const state = createMockState({
			initialProjectState: { ...EMPTY_DEFAULT_PROJECT },
			callbacks: {
				loadEditorConfigBlocks,
			},
			graphicHelper: {
				codeBlocks: [existingTopBlock, existingBottomBlock],
				nextCodeBlockCreationIndex: 2,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		editorConfigModule(store, events);

		const populateEditorConfigBlocks = events.on.mock.calls.find(
			([eventName]) => eventName === 'projectCodeBlocksPopulated'
		)?.[1];

		expect(populateEditorConfigBlocks).toBeTypeOf('function');

		await populateEditorConfigBlocks();

		expect(loadEditorConfigBlocks).toHaveBeenCalledOnce();
		expect(state.graphicHelper.codeBlocks).toHaveLength(3);
		expect(state.graphicHelper.codeBlocks[2].gridX).toBe(0);
		expect(state.graphicHelper.codeBlocks[2].gridY).toBe(13);
		expect(state.graphicHelper.codeBlocks[2].code).toContain('; @pos 0 13');
	});

	it('preserves stored coordinates when the preferred slot is already free', async () => {
		const loadEditorConfigBlocks = vi.fn(async () => [
			{
				code: ['module editorConfig', '; config', 'moduleEnd'],
				gridCoordinates: { x: 20, y: 7 },
			},
		]);
		const state = createMockState({
			initialProjectState: { ...EMPTY_DEFAULT_PROJECT },
			callbacks: {
				loadEditorConfigBlocks,
			},
			graphicHelper: {
				codeBlocks: [
					createMockCodeBlock({
						id: 'existing',
						gridX: 0,
						gridY: 0,
						width: 32 * 8,
						height: 4 * 16,
						code: ['module existing', 'moduleEnd'],
					}),
				],
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		editorConfigModule(store, events);

		const populateEditorConfigBlocks = events.on.mock.calls.find(
			([eventName]) => eventName === 'projectCodeBlocksPopulated'
		)?.[1];

		expect(populateEditorConfigBlocks).toBeTypeOf('function');

		await populateEditorConfigBlocks();

		expect(state.graphicHelper.codeBlocks[1].gridX).toBe(20);
		expect(state.graphicHelper.codeBlocks[1].gridY).toBe(7);
		expect(state.graphicHelper.codeBlocks[1].code).toContain('; @pos 20 7');
	});
});
