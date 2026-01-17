import type { BinaryAsset, ConfigBinaryAsset, State } from '@8f4e/editor-state';
import type { StateManager } from '@8f4e/state-manager';
import type { MemoryViews } from '@8f4e/web-ui';

const BINARY_ASSET_CACHE_NAME = '8f4e-binary-assets';

export async function clearBinaryAssetCache(): Promise<void> {
	if (typeof caches === 'undefined') {
		return;
	}

	await caches.delete(BINARY_ASSET_CACHE_NAME);
}

export async function loadBinaryFileIntoMemory(
	store: StateManager<State>,
	memoryViews: MemoryViews,
	asset: ConfigBinaryAsset
): Promise<void> {
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
	const maxLength = Math.min(arrayBuffer.byteLength, target.byteLength);
	const endAddress = target.byteAddress + maxLength;

	if (endAddress > byteView.byteLength) {
		console.warn('Binary asset exceeds memory bounds:', memoryId);
		return;
	}

	byteView.set(new Uint8Array(arrayBuffer, 0, maxLength), target.byteAddress);

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
