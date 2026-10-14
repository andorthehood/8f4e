import type { EventDispatcher, State } from '@8f4e/editor-state-types';
import createStateManager from '@8f4e/state-manager';
import { describe, expect, it, vi } from 'vitest';
import { createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { EMPTY_DEFAULT_PROJECT } from '../project-import/emptyDefaultProject';
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
			buttons: [{ title: 'Continue editing', action: 'dismissBinaryAssetLoadingDialog', close: false }],
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
			buttons: [{ title: 'Continue editing', action: 'dismissBinaryAssetLoadingDialog', close: false }],
		});

		store.set('binaryAssets', [
			createBinaryAsset({ loadedIntoMemory: true }),
			createBinaryAsset({ id: 'second', url: 'https://example.com/b.bin', loadedIntoMemory: true }),
		]);

		expect(events.dispatch).toHaveBeenLastCalledWith('removeDialog', { id: 'binary-assets-loading' });
	});

	it('shows compilation failures while assets are waiting for memory', () => {
		const state = createMockState({ binaryAssets: [createBinaryAsset()] });
		const store = createStateManager(state);
		const events = createEvents();
		binaryAssetLoadingDialog(store, events);

		store.set('codeErrors.compilationErrors', [
			{ codeBlockId: -1, lineNumber: 0, message: 'WebAssembly compilation failed' },
		]);

		expect(events.dispatch).toHaveBeenLastCalledWith('addDialog', {
			id: 'binary-assets-loading',
			title: 'Compilation failed',
			text: 'WebAssembly compilation failed\n\nBinary assets will load after the project compiles successfully.',
			buttons: [{ title: 'Continue editing', action: 'dismissBinaryAssetLoadingDialog', close: false }],
		});
	});

	it('keeps the dialog dismissed across metadata updates and compilation retries', () => {
		const state = createMockState({ binaryAssets: [createBinaryAsset()] });
		const store = createStateManager(state);
		const events = createEvents();
		binaryAssetLoadingDialog(store, events);
		const dismiss = vi.mocked(events.on).mock.calls.find(([name]) => name === 'dismissBinaryAssetLoadingDialog')![1];

		dismiss(undefined);
		expect(events.dispatch).toHaveBeenLastCalledWith('removeDialog', { id: 'binary-assets-loading' });
		vi.mocked(events.dispatch).mockClear();
		store.set('binaryAssets', [createBinaryAsset({ assetByteLength: 8, fileName: 'asset.bin' })]);
		store.set('codeErrors.compilationErrors', [{ codeBlockId: -1, lineNumber: 0, message: 'Compilation failed' }]);
		store.set('codeErrors.compilationErrors', []);

		expect(events.dispatch).not.toHaveBeenCalled();
	});

	it.each(['asset config', 'project load', 'completed load'])('shows a new loading dialog after %s', resetReason => {
		const state = createMockState({ binaryAssets: [createBinaryAsset()] });
		const store = createStateManager(state);
		const events = createEvents();
		binaryAssetLoadingDialog(store, events);
		const dismiss = vi.mocked(events.on).mock.calls.find(([name]) => name === 'dismissBinaryAssetLoadingDialog')![1];
		dismiss(undefined);
		vi.mocked(events.dispatch).mockClear();

		if (resetReason === 'asset config') {
			store.set('binaryAssets', [createBinaryAsset({ memoryId: 'other:buffer' })]);
		} else if (resetReason === 'project load') {
			store.set('initialProjectState', EMPTY_DEFAULT_PROJECT);
		} else {
			store.set('binaryAssets', [createBinaryAsset({ loadedIntoMemory: true })]);
			store.set('binaryAssets', [createBinaryAsset()]);
		}

		expect(events.dispatch).toHaveBeenLastCalledWith('addDialog', expect.objectContaining({ title: 'Loading assets' }));
	});

	it('removes the loading dialog and subscriptions when disposed', () => {
		const store = createStateManager(createMockState({ binaryAssets: [createBinaryAsset()] }));
		const events = createEvents();
		const dispose = binaryAssetLoadingDialog(store, events);
		dispose();
		expect(events.dispatch).toHaveBeenLastCalledWith('removeDialog', { id: 'binary-assets-loading' });
		expect(events.off).toHaveBeenCalledWith('dismissBinaryAssetLoadingDialog', expect.any(Function));
		vi.mocked(events.dispatch).mockClear();
		store.set('binaryAssets', [createBinaryAsset({ memoryId: 'other:buffer' })]);
		store.set('codeErrors.compilationErrors', []);
		store.set('initialProjectState', EMPTY_DEFAULT_PROJECT);
		expect(events.dispatch).not.toHaveBeenCalled();
	});
});
