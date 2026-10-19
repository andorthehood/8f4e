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
			projectMemoryExposuresByGroupPath: {},
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

	it.each([false, true])('fetches and loads assets through aliases=%s', async exposed => {
		const fetchedAsset: BinaryAsset = {
			url: 'https://example.com/amen.pcm',
			fileName: 'amen.pcm',
			assetByteLength: 8,
			loadedIntoMemory: false,
		};
		fetchBinaryAssetsMock.mockResolvedValue([fetchedAsset]);
		loadBinaryAssetIntoMemoryMock.mockResolvedValue();
		const store = createStateManager(createState());

		if (exposed) {
			const state = store.getState();
			state.editorConfig.bin!.amen.memory = 'audio:publicBuffer';
			state.compiler.projectMemoryExposuresByGroupPath.audio = [
				{
					name: 'publicBuffer',
					groupPath: 'audio',
					targetModuleId: 'samples',
					targetModuleName: 'samples',
					targetMemoryName: 'buffer',
					targetMemory: state.compiler.memoryPlan.modules.samples.memory.buffer,
				},
			];
		}

		binaryAssetsPlugin({
			store,
			events,
			memoryViews,
			window: {} as Window,
			navigator: {} as Navigator,
			inputTarget: {} as HTMLElement,
			setErrors: vi.fn(),
			services,
		});
		await flushPromises();

		expect(fetchBinaryAssetsMock).toHaveBeenCalledWith(['https://example.com/amen.pcm'], expect.any(Map));
		expect(store.getState().binaryAssets).toEqual([
			{
				...fetchedAsset,
				id: 'amen',
				memoryId: exposed ? 'audio:publicBuffer' : 'samples:buffer',
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
			inputTarget: {} as HTMLElement,
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
			inputTarget: {} as HTMLElement,
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
			inputTarget: {} as HTMLElement,
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

		expect(store.getState().binaryAssets).toEqual([
			{
				id: 'amen',
				url: 'https://example.com/pneumatic/sample_1.pcm',
				memoryId: 'samples:buffer',
				loadedIntoMemory: false,
			},
		]);

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
			inputTarget: {} as HTMLElement,
			setErrors: vi.fn(),
			services,
		});
		expect(store.getState().binaryAssets).toEqual([
			{
				id: 'amen',
				url: 'https://example.com/pneumatic/sample_1.pcm',
				memoryId: 'samples:buffer',
				loadedIntoMemory: false,
			},
		]);

		store.set('codeBlockRendering.codeBlocks', [
			...store.getState().codeBlockRendering.codeBlocks,
			{
				id: 'constants_env',
				moduleId: 'env',
				code: ['constants env', 'constantsEnd'],
			},
		] as State['codeBlockRendering']['codeBlocks']);
		expect(store.getState().binaryAssets).toEqual([
			{
				id: 'amen',
				url: 'https://example.com/pneumatic/sample_1.pcm',
				memoryId: 'samples:buffer',
				loadedIntoMemory: false,
			},
		]);

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

	it('deduplicates repeated URLs in first-seen order while populating each memory target and preserving first-match metadata', async () => {
		fetchBinaryAssetsMock.mockResolvedValue([
			{
				url: 'https://example.com/kick.pcm',
				fileName: 'kick-first.pcm',
				assetByteLength: 8,
				loadedIntoMemory: false,
			},
			{
				url: 'https://example.com/kick.pcm',
				fileName: 'kick-duplicate.pcm',
				assetByteLength: 16,
				loadedIntoMemory: false,
			},
			{
				url: 'https://example.com/snare.pcm',
				fileName: 'snare.pcm',
				assetByteLength: 12,
				loadedIntoMemory: false,
			},
		]);
		loadBinaryAssetIntoMemoryMock.mockResolvedValue();

		const baseState = createState();
		const previewBuffer = {
			...baseState.compiler.memoryPlan.modules.samples.memory.buffer,
			id: 'previewBuffer',
			byteAddress: 32,
			wordAlignedAddress: 8,
			endByteAddress: 32,
		};
		baseState.compiler.memoryPlan.modules.samples.memory.previewBuffer = previewBuffer;
		baseState.compiler.memoryPlan.modules.samples.declarations.push(previewBuffer);
		baseState.editorConfig.bin = {
			kick: {
				url: 'https://example.com/kick.pcm',
				memory: 'samples:buffer',
				memories: {
					preview: 'samples:previewBuffer',
				},
			},
			snare: {
				url: 'https://example.com/snare.pcm',
				memory: 'samples:buffer',
			},
			kickCopy: {
				url: 'https://example.com/kick.pcm',
				memory: 'samples:previewBuffer',
			},
		} as State['editorConfig']['bin'];

		const store = createStateManager(baseState);
		binaryAssetsPlugin({
			store,
			events,
			memoryViews,
			window: {} as Window,
			navigator: {} as Navigator,
			inputTarget: {} as HTMLElement,
			setErrors: vi.fn(),
			services,
		});
		await flushPromises();
		await flushPromises();
		await flushPromises();

		expect(fetchBinaryAssetsMock).toHaveBeenCalledTimes(1);
		expect(fetchBinaryAssetsMock).toHaveBeenCalledWith(
			['https://example.com/kick.pcm', 'https://example.com/snare.pcm'],
			expect.any(Map)
		);
		expect(store.getState().binaryAssets).toEqual([
			expect.objectContaining({
				id: 'kick',
				url: 'https://example.com/kick.pcm',
				fileName: 'kick-first.pcm',
				assetByteLength: 8,
				memoryId: 'samples:buffer',
				byteAddress: 16,
				loadedIntoMemory: true,
			}),
			expect.objectContaining({
				id: 'kick',
				url: 'https://example.com/kick.pcm',
				fileName: 'kick-first.pcm',
				assetByteLength: 8,
				memoryId: 'samples:previewBuffer',
				byteAddress: 32,
				loadedIntoMemory: true,
			}),
			expect.objectContaining({
				id: 'snare',
				url: 'https://example.com/snare.pcm',
				fileName: 'snare.pcm',
				assetByteLength: 12,
				memoryId: 'samples:buffer',
				byteAddress: 16,
				loadedIntoMemory: true,
			}),
			expect.objectContaining({
				id: 'kickCopy',
				url: 'https://example.com/kick.pcm',
				fileName: 'kick-first.pcm',
				assetByteLength: 8,
				memoryId: 'samples:previewBuffer',
				byteAddress: 32,
				loadedIntoMemory: true,
			}),
		]);
	});

	it('skips missing fetched metadata with a warning and ignores stale or disposed fetch completions', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		let resolveFirstFetch: (assets: BinaryAsset[]) => void = () => {};
		fetchBinaryAssetsMock
			.mockReturnValueOnce(
				new Promise(resolve => {
					resolveFirstFetch = resolve;
				})
			)
			.mockResolvedValueOnce([
				{
					url: 'https://example.com/present.pcm',
					fileName: 'present.pcm',
					assetByteLength: 8,
					loadedIntoMemory: false,
				},
			]);
		loadBinaryAssetIntoMemoryMock.mockResolvedValue();

		const store = createStateManager(createState({ url: 'https://example.com/stale.pcm' }));
		binaryAssetsPlugin({
			store,
			events,
			memoryViews,
			window: {} as Window,
			navigator: {} as Navigator,
			inputTarget: {} as HTMLElement,
			setErrors: vi.fn(),
			services,
		});

		store.set('editorConfig.bin', {
			missing: {
				url: 'https://example.com/missing.pcm',
				memory: 'samples:buffer',
			},
			present: {
				url: 'https://example.com/present.pcm',
				memory: 'samples:buffer',
			},
		} as State['editorConfig']['bin']);
		await flushPromises();

		expect(warnSpy).toHaveBeenCalledWith('Binary asset metadata missing for url:', 'https://example.com/missing.pcm');
		expect(store.getState().binaryAssets).toEqual([
			expect.objectContaining({
				id: 'present',
				url: 'https://example.com/present.pcm',
				fileName: 'present.pcm',
				memoryId: 'samples:buffer',
				loadedIntoMemory: true,
			}),
		]);

		resolveFirstFetch([
			{
				url: 'https://example.com/stale.pcm',
				fileName: 'stale.pcm',
				assetByteLength: 8,
				loadedIntoMemory: false,
			},
		]);
		await flushPromises();

		expect(store.getState().binaryAssets).toEqual([
			expect.objectContaining({
				id: 'present',
				url: 'https://example.com/present.pcm',
			}),
		]);

		let resolveDisposedFetch: (assets: BinaryAsset[]) => void = () => {};
		fetchBinaryAssetsMock.mockReturnValueOnce(
			new Promise(resolve => {
				resolveDisposedFetch = resolve;
			})
		);
		const disposedStore = createStateManager(createState({ url: 'https://example.com/disposed.pcm' }));
		const cleanup = binaryAssetsPlugin({
			store: disposedStore,
			events,
			memoryViews,
			window: {} as Window,
			navigator: {} as Navigator,
			inputTarget: {} as HTMLElement,
			setErrors: vi.fn(),
			services,
		});
		cleanup();
		resolveDisposedFetch([
			{
				url: 'https://example.com/disposed.pcm',
				fileName: 'disposed.pcm',
				assetByteLength: 8,
				loadedIntoMemory: false,
			},
		]);
		await flushPromises();

		expect(disposedStore.getState().binaryAssets).toEqual([]);
		warnSpy.mockRestore();
	});

	it('logs failed fetches for the active generation and ignores stale or disposed fetch rejections', async () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const activeError = new Error('network failure');
		let rejectStaleFetch: (reason?: unknown) => void = () => {};
		let rejectDisposedFetch: (reason?: unknown) => void = () => {};

		fetchBinaryAssetsMock
			.mockReturnValueOnce(
				new Promise((_, reject) => {
					rejectStaleFetch = reject;
				})
			)
			.mockRejectedValueOnce(activeError)
			.mockReturnValueOnce(
				new Promise((_, reject) => {
					rejectDisposedFetch = reject;
				})
			);
		loadBinaryAssetIntoMemoryMock.mockResolvedValue();

		const store = createStateManager(createState({ url: 'https://example.com/stale-fail.pcm' }));
		const cleanup = binaryAssetsPlugin({
			store,
			events,
			memoryViews,
			window: {} as Window,
			navigator: {} as Navigator,
			inputTarget: {} as HTMLElement,
			setErrors: vi.fn(),
			services,
		});

		store.set('editorConfig.bin', {
			amen: {
				url: 'https://example.com/active-fail.pcm',
				memory: 'samples:buffer',
			},
		} as State['editorConfig']['bin']);
		await flushPromises();

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenCalledWith('Failed to fetch binary assets:', activeError);

		rejectStaleFetch(new Error('stale failure'));
		await flushPromises();
		expect(errorSpy).toHaveBeenCalledTimes(1);

		store.set('editorConfig.bin', {
			amen: {
				url: 'https://example.com/disposed-fail.pcm',
				memory: 'samples:buffer',
			},
		} as State['editorConfig']['bin']);
		cleanup();
		rejectDisposedFetch(new Error('disposed failure'));
		await flushPromises();

		expect(errorSpy).toHaveBeenCalledTimes(1);
		errorSpy.mockRestore();
	});
});
