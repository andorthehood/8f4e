import { State } from '../types';
import { EventDispatcher } from '../../events';

export default function binaryAssets(state: State, events: EventDispatcher): () => void {
	async function onImportBinaryAsset() {
		// @ts-ignore
		const fileHandles: FileSystemFileHandle[] = await window.showOpenFilePicker();

		const file = await fileHandles[0].getFile();

		const dataUrl = await new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});

		const base64data = dataUrl.split(',')[1];

		if (!state.project.binaryAssets) {
			state.project.binaryAssets = [];
		}
		state.project.binaryAssets.push({ data: base64data, fileName: file.name });
		events.dispatch('saveState');
	}

	events.on('importBinaryAsset', onImportBinaryAsset);

	return () => {
		events.off('importBinaryAsset', onImportBinaryAsset);
	};
}
