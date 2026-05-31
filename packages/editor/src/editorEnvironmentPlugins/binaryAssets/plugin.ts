import type { EditorEnvironmentPluginContext } from '../types';
import createBinaryAssetDirectiveSync from './directiveSync';
import createBinaryAssetMemoryLoader from './memoryLoader';

export default function binaryAssetsPlugin({
	store,
	memoryViews,
	setErrors,
}: EditorEnvironmentPluginContext): () => void {
	const assetStore = new Map<string, ArrayBuffer>();
	let disposed = false;
	const cleanupDirectiveSync = createBinaryAssetDirectiveSync({
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
		cleanupDirectiveSync();
		cleanupMemoryLoader();
		assetStore.clear();
		setErrors([]);
		store.set('binaryAssets', []);
	};
}
