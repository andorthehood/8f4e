import type { EventDispatcher, State } from '@8f4e/editor-state-types';
import createStateManager from '@8f4e/state-manager';
import { describe, expect, it, vi } from 'vitest';
import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import binaryAssetLoadingDialog from './effect';

function createEvents(): EventDispatcher {
	return {
		on: vi.fn(),
		off: vi.fn(),
		dispatch: vi.fn(),
	};
}

function createBinaryAsset(overrides: Partial<State['binaryAssets'][number]> = {}): State['binaryAssets'][number] {
	return {
		id: 'asset',
		url: 'https://example.com/asset.bin',
		memoryId: 'samples:buffer',
		loadedIntoMemory: false,
		...overrides,
	};
}

describe('binary asset loading dialog effect', () => {
	it('does not dispatch a dialog when there are no binary assets', () => {
		const state = createMockState({ binaryAssets: [] });
		const store = createStateManager(state);
		const events = createEvents();

		binaryAssetLoadingDialog(store, events);

		expect(events.dispatch).not.toHaveBeenCalled();
	});

	it('adds a loading dialog while assets are pending', () => {
		const state = createMockState({
			binaryAssets: [createBinaryAsset(), createBinaryAsset({ id: 'loaded', loadedIntoMemory: true })],
		});
		const store = createStateManager(state);
		const events = createEvents();

		binaryAssetLoadingDialog(store, events);

		expect(events.dispatch).toHaveBeenCalledWith('addDialog', {
			id: 'binary-assets-loading',
			title: 'Loading assets',
			text: 'Loading binary assets...',
			buttons: [],
		});
	});

	it('updates and removes the loading dialog as assets load', () => {
		const state = createMockState({ binaryAssets: [] });
		const store = createStateManager(state);
		const events = createEvents();

		binaryAssetLoadingDialog(store, events);

		store.set('binaryAssets', [
			createBinaryAsset(),
			createBinaryAsset({ id: 'second', url: 'https://example.com/b.bin' }),
		]);

		expect(events.dispatch).toHaveBeenLastCalledWith('addDialog', {
			id: 'binary-assets-loading',
			title: 'Loading assets',
			text: 'Loading binary assets...',
			buttons: [],
		});

		store.set('binaryAssets', [
			createBinaryAsset({ loadedIntoMemory: true }),
			createBinaryAsset({ id: 'second', url: 'https://example.com/b.bin', loadedIntoMemory: true }),
		]);

		expect(events.dispatch).toHaveBeenLastCalledWith('removeDialog', { id: 'binary-assets-loading' });
	});
});
