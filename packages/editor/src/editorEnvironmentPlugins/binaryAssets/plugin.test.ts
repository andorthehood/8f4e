import type { BinaryAsset, EventDispatcher, State } from '@8f4e/editor-state-types';
import createStateManager from '@8f4e/state-manager';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EditorEnvironmentPluginContext } from '../types';
import fetchBinaryAssets from './fetchBinaryAssets';
import loadBinaryAssetIntoMemory from './loadBinaryAssetIntoMemory';
import binaryAssetsPlugin from './plugin';

vi.mock('./fetchBinaryAssets', () => ({
	default: vi.fn(),
}));

vi.mock('./loadBinaryAssetIntoMemory', () => ({
	default: vi.fn(),
}));

const fetchBinaryAssetsMock = vi.mocked(fetchBinaryAssets);
const loadBinaryAssetIntoMemoryMock = vi.mocked(loadBinaryAssetIntoMemory);

function createMemoryPlan(byteAddress: number): State['compiler']['memoryPlan'] {
	const buffer = {
		id: 'buffer',
		numberOfElements: 1,
		elementWordSize: 4,
		type: 'int',
		memoryIndex: 0,
		byteAddress,
		elementByteLength: 4,
		wordAlignedSize: 4,
		wordAlignedByteLength: 16,
		wordAlignedAddress: byteAddress / 4,
		endByteAddress: byteAddress,
		endAddressSafeByteLength: 4,
		lineNumber: 1,
		isInteger: true,
		pointerDepth: 0,
		isUnsigned: false,
	};
	const samples = {
		id: 'samples',
		lineNumber: 1,
		memoryIndex: 0,
		byteAddress,
		wordAlignedSize: buffer.wordAlignedSize,
		wordAlignedByteLength: buffer.wordAlignedByteLength,
		endByteAddress: byteAddress,
		endAddressSafeByteLength: 4,
		memory: { buffer },
		declarations: [buffer],
		declarationSources: [],
	};

	return {
		modules: { samples },
		moduleList: [samples],
		nextByteAddressByMemoryIndex: {},
	};
}

function createState({
	url = 'https://example.com/amen.pcm',
	byteAddress = 16,
}: {
	url?: string;
	byteAddress?: number;
} = {}): State {
	return {
		codeBlockRendering: {
			codeBlocks: [],
		},
		editorConfig: {
			bin: {
				amen: {
					url,
					memory: 'samples:buffer',
				},
			},
		},
		compiler: {
			memoryPlan: createMemoryPlan(byteAddress),
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
	const services: EditorEnvironmentPluginContext['services'] = {
		getWasmExports: vi.fn(),
	};

	beforeEach(() => {
		events = {
			on: vi.fn(),
			off: vi.fn(),
			dispatch: vi.fn(),
		} as EventDispatcher;
		fetchBinaryAssetsMock.mockReset();
		loadBinaryAssetIntoMemoryMock.mockReset();
	});

	it('fetches configured assets and loads them into resolved memory', async () => {
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
			services,
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
			services,
		});
		await flushPromises();

		cleanup();

		expect(store.getState().binaryAssets).toEqual([]);
	});

	it('reloads assets when memory plan changes after a project load with reused asset ids', async () => {
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
			services,
		});
		await flushPromises();

		store.set('editorConfig.bin', {
			amen: {
				url: 'https://example.com/pneumatic/sample_1.pcm',
				memory: 'samples:buffer',
			},
		} as State['editorConfig']['bin']);
		await flushPromises();

		store.set('compiler.memoryPlan', createMemoryPlan(16));
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
			services,
		});
		await flushPromises();
		expect(store.getState().binaryAssets[0].assetByteLength).toBe(12);

		store.set('editorConfig.bin', {
			amen: {
				url: 'https://example.com/pneumatic/sample_1.pcm',
				memory: 'samples:buffer',
			},
		} as State['editorConfig']['bin']);

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

	it('keeps pending fetch alive when unrelated code block changes preserve asset config', async () => {
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
			services,
		});
		expect(store.getState().binaryAssets).toEqual([]);

		store.set('codeBlockRendering.codeBlocks', [
			...store.getState().codeBlockRendering.codeBlocks,
			{
				id: 'constants_env',
				moduleId: 'env',
				code: ['constants env', 'constantsEnd'],
			},
		] as State['codeBlockRendering']['codeBlocks']);
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
