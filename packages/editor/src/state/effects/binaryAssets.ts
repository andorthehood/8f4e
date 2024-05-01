import { State } from '../types';
import { EventDispatcher } from '../../events';

export default function binaryAssets(state: State, events: EventDispatcher): () => void {
	async function onImportBinaryAsset() {
		// @ts-ignore
		const fileHandles: FileSystemFileHandle[] = await window.showOpenFilePicker();

		console.log(fileHandles);

		const file = await fileHandles[0].getFile();

		const opfsRoot = await navigator.storage.getDirectory();
		const fileHandle2 = await opfsRoot.getFileHandle('my first file', {
			create: true,
		});

		const writable = await fileHandle2.createWritable();
		writable.write(await file.arrayBuffer());
	}

	events.on('importBinaryAsset', onImportBinaryAsset);

	return () => {
		events.off('importBinaryAsset', onImportBinaryAsset);
	};
}
