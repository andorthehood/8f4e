import type { DialogContent, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';

const BINARY_ASSET_LOADING_DIALOG_ID = 'binary-assets-loading';
const DISMISS_BINARY_ASSET_LOADING_DIALOG = 'dismissBinaryAssetLoadingDialog';

function createBinaryAssetLoadingDialog(state: State): DialogContent | undefined {
	if (state.binaryAssets.length === 0) {
		return undefined;
	}

	const hasPendingAssets = state.binaryAssets.some(asset => !asset.loadedIntoMemory);
	if (!hasPendingAssets) {
		return undefined;
	}

	const compilationError = state.codeErrors.compilationErrors[0];
	return {
		id: BINARY_ASSET_LOADING_DIALOG_ID,
		title: compilationError ? 'Compilation failed' : 'Loading assets',
		text: compilationError
			? `${compilationError.message}\n\nBinary assets will load after the project compiles successfully.`
			: 'Loading binary assets...',
		buttons: [{ title: 'Continue editing', action: DISMISS_BINARY_ASSET_LOADING_DIALOG, close: false }],
	};
}

export default function binaryAssetLoadingDialog(store: StateManager<State>, events: EventDispatcher): () => void {
	let loadingDialogVisible = store.getState().dialogStack.some(dialog => dialog.id === BINARY_ASSET_LOADING_DIALOG_ID);
	let dismissed = false;
	let assetSignature = '';

	function removeLoadingDialog(): void {
		if (loadingDialogVisible) {
			loadingDialogVisible = false;
			events.dispatch('removeDialog', { id: BINARY_ASSET_LOADING_DIALOG_ID });
		}
	}

	function syncBinaryAssetLoadingDialog(): void {
		const state = store.getState();
		const nextAssetSignature = JSON.stringify(state.binaryAssets.map(asset => [asset.id, asset.url, asset.memoryId]));
		if (nextAssetSignature !== assetSignature) {
			assetSignature = nextAssetSignature;
			dismissed = false;
		}
		const dialog = createBinaryAssetLoadingDialog(state);
		if (!dialog) {
			dismissed = false;
		}

		if (dialog && !dismissed) {
			loadingDialogVisible = true;
			events.dispatch('addDialog', dialog);
			return;
		}

		removeLoadingDialog();
	}

	function dismissLoadingDialog(): void {
		dismissed = true;
		removeLoadingDialog();
	}

	function resetLoadingDialog(): void {
		dismissed = false;
		syncBinaryAssetLoadingDialog();
	}

	store.subscribe('binaryAssets', syncBinaryAssetLoadingDialog);
	store.subscribe('codeErrors.compilationErrors', syncBinaryAssetLoadingDialog);
	store.subscribe('initialProjectState', resetLoadingDialog);
	events.on(DISMISS_BINARY_ASSET_LOADING_DIALOG, dismissLoadingDialog);

	syncBinaryAssetLoadingDialog();

	return () => {
		store.unsubscribe('binaryAssets', syncBinaryAssetLoadingDialog);
		store.unsubscribe('codeErrors.compilationErrors', syncBinaryAssetLoadingDialog);
		store.unsubscribe('initialProjectState', resetLoadingDialog);
		events.off(DISMISS_BINARY_ASSET_LOADING_DIALOG, dismissLoadingDialog);
		removeLoadingDialog();
	};
}
