import initState, { Callbacks, State, RuntimeRegistry, ConfigBinaryAsset, BinaryAsset } from '@8f4e/editor-state';
import initView, { MemoryViews } from '@8f4e/web-ui';
import generateSprite from '@8f4e/sprite-generator';

import initEvents from './events';
import pointerEvents from './events/pointerEvents';
import keyboardEvents from './events/keyboardEvents';
import { createMemoryViewManager, MemoryRef } from './memoryViewManager';
import { createSpriteSheetManager } from './spriteSheetManager';
import { updateStateWithSpriteData } from './updateStateWithSpriteData';

const BINARY_ASSET_CACHE_NAME = '8f4e-binary-assets';

// Re-export types that consumers might need
export type {
	Project,
	Options,
	State,
	EditorSettings,
	CompilationResult,
	CodeBlockGraphicData,
	RuntimeFactory,
	RuntimeRegistry,
	RuntimeRegistryEntry,
	FeatureFlags,
	FeatureFlagsConfig,
	JSONSchemaLike,
} from '@8f4e/editor-state';
export type { EventDispatcher } from './events';
export type { MemoryRef } from './memoryViewManager';

// Re-export helper functions
export { updateStateWithSpriteData } from './updateStateWithSpriteData';

export interface Editor {
	resize: (width: number, height: number) => void;
	updateMemoryViews: (memoryRef: MemoryRef) => void;
	getMemoryViews: () => MemoryViews;
	dispose: () => void;
	state: State;
}

interface Options {
	featureFlags?: Partial<State['featureFlags']>;
	callbacks: Omit<Callbacks, 'getWordFromMemory' | 'setWordInMemory' | 'readClipboardText' | 'writeClipboardText'>;
	runtimeRegistry: RuntimeRegistry;
	defaultRuntimeId: string;
}

async function getBinaryAssetResponse(url: string): Promise<Response | null> {
	try {
		if (typeof caches === 'undefined') {
			return await fetch(url);
		}

		const cache = await caches.open(BINARY_ASSET_CACHE_NAME);
		const cached = await cache.match(url);
		if (cached) {
			return cached;
		}

		const response = await fetch(url);
		if (response.ok) {
			await cache.put(url, response.clone());
		}
		return response;
	} catch (error) {
		console.warn('Failed to fetch binary asset:', error);
		return null;
	}
}

function resolveBinaryAssetTarget(state: State, memoryId: string): { byteAddress: number; byteLength: number } | null {
	const [moduleId, memoryName] = memoryId.split('.');
	if (!moduleId || !memoryName) {
		return null;
	}

	const memory = state.compiler.compiledModules[moduleId]?.memoryMap[memoryName];
	if (!memory) {
		return null;
	}

	return {
		byteAddress: memory.byteAddress,
		byteLength: memory.wordAlignedSize * 4,
	};
}

function getBinaryAssetFileName(url: string): string {
	try {
		const parsed = new URL(url, window.location.href);
		const name = parsed.pathname.split('/').filter(Boolean).pop();
		return name || 'binary-asset';
	} catch {
		const parts = url.split('/').filter(Boolean);
		return parts[parts.length - 1] || 'binary-asset';
	}
}

export default async function init(canvas: HTMLCanvasElement, options: Options): Promise<Editor> {
	const { memoryViews, updateMemoryViews } = createMemoryViewManager(new ArrayBuffer(0));
	const events = initEvents();
	let store: ReturnType<typeof initState>;

	const clearBinaryAssetCache = async () => {
		if (typeof caches === 'undefined') {
			return;
		}

		await caches.delete(BINARY_ASSET_CACHE_NAME);
	};

	const loadBinaryFileIntoMemory = async (asset: ConfigBinaryAsset) => {
		const { url, memoryId } = asset;
		if (!url || !memoryId) {
			console.warn('Binary asset missing url or memoryId');
			return;
		}

		const response = await getBinaryAssetResponse(url);
		if (!response?.ok) {
			console.warn('Failed to load binary asset:', url);
			return;
		}

		const arrayBuffer = await response.arrayBuffer();
		const state = store.getState();
		const target = resolveBinaryAssetTarget(state, memoryId);

		if (!target) {
			console.warn('Unable to resolve memory target:', memoryId);
			return;
		}

		const byteView = new Uint8Array(memoryViews.int32.buffer);
		const endAddress = target.byteAddress + arrayBuffer.byteLength;
		const targetEndAddress = target.byteAddress + target.byteLength;

		if (endAddress > byteView.byteLength || endAddress > targetEndAddress) {
			console.warn('Binary asset exceeds memory bounds:', memoryId);
			return;
		}

		byteView.set(new Uint8Array(arrayBuffer), target.byteAddress);

		const contentType = response.headers.get('content-type') || undefined;
		const fileName = getBinaryAssetFileName(url);
		const nextAsset: BinaryAsset = {
			fileName,
			url,
			memoryId,
			mimeType: contentType || undefined,
			sizeBytes: arrayBuffer.byteLength,
		};
		const existing = state.binaryAssets.filter(
			loaded => !(loaded.url === nextAsset.url && loaded.memoryId === nextAsset.memoryId)
		);

		store.set('binaryAssets', [...existing, nextAsset]);
	};

	store = initState(events, {
		...options,
		callbacks: {
			...options.callbacks,
			getWordFromMemory: (wordAlignedAddress: number) => {
				return memoryViews.int32[wordAlignedAddress] || 0;
			},
			setWordInMemory: (wordAlignedAddress: number, value: number) => {
				memoryViews.int32[wordAlignedAddress] = value;
			},
			loadBinaryFileIntoMemory: options.callbacks.loadBinaryFileIntoMemory ?? (asset => loadBinaryFileIntoMemory(asset)),
			clearBinaryAssetCache: options.callbacks.clearBinaryAssetCache ?? clearBinaryAssetCache,
			readClipboardText: async () => {
				return await navigator.clipboard.readText();
			},
			writeClipboardText: async (text: string) => {
				await navigator.clipboard.writeText(text);
			},
		},
	});
	const state = store.getState();
	pointerEvents(canvas, events, state);
	const cleanupKeyboard = keyboardEvents(events);

	// Generate sprite data and update state before initializing view
	const spriteData = generateSprite({
		font: state.editorSettings.font || '8x16',
		colorScheme: state.colorScheme,
	});

	updateStateWithSpriteData(state, spriteData);

	const view = await initView(state, canvas, memoryViews, spriteData);
	createSpriteSheetManager(store, view, events);

	events.on('loadPostProcessEffects', () => {
		view.loadPostProcessEffects(state.graphicHelper.postProcessEffects);
	});

	return {
		resize: (width: number, height: number) => {
			events.dispatch('resize', { canvasWidth: width, canvasHeight: height });
			view.resize(width, height);
		},
		updateMemoryViews,
		getMemoryViews: () => memoryViews,
		dispose: cleanupKeyboard,
		state,
	};
}
