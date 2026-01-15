import type { MenuGenerator } from '~/types';

export const binaryAssetsMenu: MenuGenerator = async () => {
	const opfsRoot = await navigator.storage.getDirectory();
	const entries = (
		opfsRoot as unknown as { entries: () => AsyncIterableIterator<[string, FileSystemFileHandle]> }
	).entries();

	const files: [string, FileSystemFileHandle][] = [];
	for await (const [name, file] of entries) {
		files.push([name, file]);
	}

	return files.map(([name, file]) => ({
		title: name,
		action: 'openBinaryAsset',
		payload: { file },
		close: true,
	}));
};
