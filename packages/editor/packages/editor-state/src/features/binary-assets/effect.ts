import type { DialogContent, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';

const BINARY_ASSET_LOADING_DIALOG_ID = 'binary-assets-loading';

function createBinaryAssetLoadingDialog(state: State): DialogContent | undefined {
	const totalAssetCount = state.binaryAssets.length;
	if (totalAssetCount === 0) {
		return undefined;
	}

	const loadedAssetCount = state.binaryAssets.filter(asset => asset.loadedIntoMemory).length;
	if (loadedAssetCount === totalAssetCount) {
		return undefined;
	}

	return {
		id: BINARY_ASSET_LOADING_DIALOG_ID,
		title: 'Loading assets',
		text: `Loading binary assets (${loadedAssetCount}/${totalAssetCount}).`,
		buttons: [],
	};
}

export default function binaryAssetLoadingDialog(store: StateManager<State>, events: EventDispatcher): void {
	let loadingDialogVisible = store.getState().dialogStack.some(dialog => dialog.id === BINARY_ASSET_LOADING_DIALOG_ID);

	function syncBinaryAssetLoadingDialog(): void {
		const dialog = createBinaryAssetLoadingDialog(store.getState());

		if (dialog) {
			loadingDialogVisible = true;
			events.dispatch('addDialog', dialog);
			return;
		}

		if (loadingDialogVisible) {
			loadingDialogVisible = false;
			events.dispatch('removeDialog', { id: BINARY_ASSET_LOADING_DIALOG_ID });
		}
	}

	store.subscribe('binaryAssets', syncBinaryAssetLoadingDialog);

	syncBinaryAssetLoadingDialog();
}
