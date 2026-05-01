import { beforeEach, describe, expect, it, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import binaryAssetsPlugin from './plugin';
import fetchBinaryAssets from './fetchBinaryAssets';
import loadBinaryAssetIntoMemory from './loadBinaryAssetIntoMemory';

import type { BinaryAsset, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { EditorEnvironmentPluginContext } from '../types';

vi.mock('./fetchBinaryAssets', () => ({
	default: vi.fn(),
}));

vi.mock('./loadBinaryAssetIntoMemory', () => ({
	default: vi.fn(),
}));

const fetchBinaryAssetsMock = vi.mocked(fetchBinaryAssets);
const loadBinaryAssetIntoMemoryMock = vi.mocked(loadBinaryAssetIntoMemory);

function createState(): State {
	return {
		graphicHelper: {
			codeBlocks: [
				{
					moduleId: 'samples',
					code: [
						'module samples',
						'; @defAsset amen https://example.com/amen.pcm',
						'; @loadAsset amen &buffer',
						'moduleEnd',
					],
				},
			],
		},
		compiler: {
			hasMemoryBeenReinitialized: true,
			compiledModules: {
				samples: {
					memoryMap: {
						buffer: {
							byteAddress: 16,
							wordAlignedSize: 4,
						},
					},
				},
			},
		},
		binaryAssets: [],
	} as unknown as State;
}

async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe('binary assets plugin', () => {
	let events: EventDispatcher;
	const memoryViews = {} as EditorEnvironmentPluginContext['memoryViews'];

	beforeEach(() => {
		events = {
			on: vi.fn(),
			off: vi.fn(),
			dispatch: vi.fn(),
		} as EventDispatcher;
		fetchBinaryAssetsMock.mockReset();
		loadBinaryAssetIntoMemoryMock.mockReset();
	});

	it('fetches directive assets and loads them into resolved memory', async () => {
		const fetchedAsset: BinaryAsset = {
			url: 'https://example.com/amen.pcm',
			fileName: 'amen.pcm',
			assetByteLength: 8,
			loadedIntoMemory: false,
		};
		fetchBinaryAssetsMock.mockResolvedValue([fetchedAsset]);
		loadBinaryAssetIntoMemoryMock.mockResolvedValue();
		const store = createStateManager(createState());

		binaryAssetsPlugin({
			store,
			events,
			memoryViews,
			window: {} as Window,
			navigator: {} as Navigator,
			setErrors: vi.fn(),
		});
		await flushPromises();

		expect(fetchBinaryAssetsMock).toHaveBeenCalledWith(['https://example.com/amen.pcm'], expect.any(Map));
		expect(store.getState().binaryAssets).toEqual([
			{
				...fetchedAsset,
				id: 'amen',
				memoryId: 'samples:buffer',
				loadedIntoMemory: true,
				byteAddress: 16,
				memoryByteLength: 16,
			},
		]);
		expect(loadBinaryAssetIntoMemoryMock).toHaveBeenCalledWith(
			store.getState().binaryAssets[0],
			expect.any(Map),
			memoryViews
		);
	});

	it('clears binary asset state on cleanup', async () => {
		fetchBinaryAssetsMock.mockResolvedValue([
			{
				url: 'https://example.com/amen.pcm',
				fileName: 'amen.pcm',
				assetByteLength: 8,
				loadedIntoMemory: false,
			},
		]);
		loadBinaryAssetIntoMemoryMock.mockResolvedValue();
		const store = createStateManager(createState());

		const cleanup = binaryAssetsPlugin({
			store,
			events,
			memoryViews,
			window: {} as Window,
			navigator: {} as Navigator,
			setErrors: vi.fn(),
		});
		await flushPromises();

		cleanup();

		expect(store.getState().binaryAssets).toEqual([]);
	});
});
