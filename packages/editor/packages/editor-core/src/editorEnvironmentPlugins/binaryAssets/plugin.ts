import type { EditorEnvironmentPluginContext } from '../types';
import createBinaryAssetConfigSync from './configSync';
import createBinaryAssetMemoryLoader from './memoryLoader';

export default function binaryAssetsPlugin({
	store,
	memoryViews,
	setErrors,
}: EditorEnvironmentPluginContext): () => void {
	const assetStore = new Map<string, ArrayBuffer>();
	let disposed = false;
	const cleanupConfigSync = createBinaryAssetConfigSync({
		store,
		assetStore,
		setErrors,
		isDisposed: () => disposed,
	});
	const cleanupMemoryLoader = createBinaryAssetMemoryLoader({
		store,
		memoryViews,
		assetStore,
	});

	return () => {
		disposed = true;
		cleanupConfigSync();
		cleanupMemoryLoader();
		assetStore.clear();
		setErrors([]);
		store.set('binaryAssets', []);
	};
}
