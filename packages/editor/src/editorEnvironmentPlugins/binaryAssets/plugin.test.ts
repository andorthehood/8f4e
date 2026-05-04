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

function createState({
	url = 'https://example.com/amen.pcm',
	byteAddress = 16,
}: {
	url?: string;
	byteAddress?: number;
} = {}): State {
	return {
		graphicHelper: {
			codeBlocks: [
				{
					moduleId: 'samples',
					code: ['module samples', `; @defAsset amen ${url}`, '; @loadAsset amen &buffer', 'moduleEnd'],
				},
			],
		},
		compiler: {
			hasMemoryBeenReinitialized: true,
			compiledModules: {
				samples: {
					memoryMap: {
						buffer: {
							byteAddress,
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

	it('reloads assets when compiled modules change after a project load with reused asset ids', async () => {
		fetchBinaryAssetsMock.mockImplementation(async urls =>
			urls.map(url => ({
				url,
				fileName: url.split('/').pop() ?? 'asset.bin',
				assetByteLength: 8,
				loadedIntoMemory: false,
			}))
		);
		loadBinaryAssetIntoMemoryMock.mockResolvedValue();
		const store = createStateManager(createState({ url: 'https://example.com/hymn/sample_1.bin', byteAddress: 16 }));

		binaryAssetsPlugin({
			store,
			events,
			memoryViews,
			window: {} as Window,
			navigator: {} as Navigator,
			setErrors: vi.fn(),
		});
		await flushPromises();

		store.set('graphicHelper.codeBlocks', [
			{
				moduleId: 'samples',
				code: [
					'module samples',
					'; @defAsset amen https://example.com/pneumatic/sample_1.pcm',
					'; @loadAsset amen &buffer',
					'moduleEnd',
				],
			},
		] as State['graphicHelper']['codeBlocks']);
		await flushPromises();

		store.set('compiler.compiledModules', {
			samples: {
				memoryMap: {
					buffer: {
						byteAddress: 16,
						wordAlignedSize: 4,
					},
				},
			},
		} as unknown as State['compiler']['compiledModules']);
		await flushPromises();

		expect(loadBinaryAssetIntoMemoryMock).toHaveBeenLastCalledWith(
			expect.objectContaining({
				url: 'https://example.com/pneumatic/sample_1.pcm',
				id: 'amen',
				memoryId: 'samples:buffer',
				byteAddress: 16,
				memoryByteLength: 16,
			}),
			expect.any(Map),
			memoryViews
		);
		expect(loadBinaryAssetIntoMemoryMock).toHaveBeenCalledTimes(3);
	});

	it('clears old asset metadata before publishing newly fetched assets', async () => {
		let resolveFetch: (assets: BinaryAsset[]) => void = () => {};
		fetchBinaryAssetsMock
			.mockResolvedValueOnce([
				{
					url: 'https://example.com/hymn/sample_1.bin',
					fileName: 'sample_1.bin',
					assetByteLength: 12,
					loadedIntoMemory: false,
				},
			])
			.mockReturnValueOnce(
				new Promise(resolve => {
					resolveFetch = resolve;
				})
			);
		loadBinaryAssetIntoMemoryMock.mockResolvedValue();
		const store = createStateManager(createState({ url: 'https://example.com/hymn/sample_1.bin' }));

		binaryAssetsPlugin({
			store,
			events,
			memoryViews,
			window: {} as Window,
			navigator: {} as Navigator,
			setErrors: vi.fn(),
		});
		await flushPromises();
		expect(store.getState().binaryAssets[0].assetByteLength).toBe(12);

		store.set('graphicHelper.codeBlocks', [
			{
				moduleId: 'samples',
				code: [
					'module samples',
					'; @defAsset amen https://example.com/pneumatic/sample_1.pcm',
					'; @loadAsset amen &buffer',
					'moduleEnd',
				],
			},
		] as State['graphicHelper']['codeBlocks']);

		expect(store.getState().binaryAssets).toEqual([]);

		resolveFetch([
			{
				url: 'https://example.com/pneumatic/sample_1.pcm',
				fileName: 'sample_1.pcm',
				assetByteLength: 8,
				loadedIntoMemory: false,
			},
		]);
		await flushPromises();

		expect(store.getState().binaryAssets[0]).toEqual(
			expect.objectContaining({
				url: 'https://example.com/pneumatic/sample_1.pcm',
				fileName: 'sample_1.pcm',
				assetByteLength: 8,
			})
		);
	});

	it('keeps pending fetch alive when unrelated code block changes preserve asset directives', async () => {
		let resolveFetch: (assets: BinaryAsset[]) => void = () => {};
		fetchBinaryAssetsMock.mockReturnValueOnce(
			new Promise(resolve => {
				resolveFetch = resolve;
			})
		);
		loadBinaryAssetIntoMemoryMock.mockResolvedValue();
		const store = createStateManager(createState({ url: 'https://example.com/pneumatic/sample_1.pcm' }));

		binaryAssetsPlugin({
			store,
			events,
			memoryViews,
			window: {} as Window,
			navigator: {} as Navigator,
			setErrors: vi.fn(),
		});
		expect(store.getState().binaryAssets).toEqual([]);

		store.set('graphicHelper.codeBlocks', [
			...store.getState().graphicHelper.codeBlocks,
			{
				id: 'constants_env',
				moduleId: 'env',
				code: ['constants env', 'constantsEnd'],
			},
		] as State['graphicHelper']['codeBlocks']);
		expect(store.getState().binaryAssets).toEqual([]);

		resolveFetch([
			{
				url: 'https://example.com/pneumatic/sample_1.pcm',
				fileName: 'sample_1.pcm',
				assetByteLength: 8,
				loadedIntoMemory: false,
			},
		]);
		await flushPromises();

		expect(store.getState().binaryAssets[0]).toEqual(
			expect.objectContaining({
				url: 'https://example.com/pneumatic/sample_1.pcm',
				fileName: 'sample_1.pcm',
				assetByteLength: 8,
			})
		);
	});
});
