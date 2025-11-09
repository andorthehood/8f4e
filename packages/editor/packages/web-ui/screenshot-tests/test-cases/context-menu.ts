import init from '@8f4e/web-ui';
import { createMockState } from '@8f4e/editor-state/testing';

import generateContextMenuMock from '../utils/generateContextMenuMock';

async function initializeWebUI() {
	const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
	if (!canvas) {
		throw new Error('Canvas element not found');
	}

	const mockState = createMockState({
		featureFlags: {
			contextMenu: true,
			infoOverlay: false,
			moduleDragging: false,
			viewportDragging: false,
			persistentStorage: false,
			editing: false,
		},
	});
	const webUI = await init(mockState, canvas);

	mockState.graphicHelper.contextMenu = generateContextMenuMock();

	console.log('Web-UI initialized:', webUI);
	return webUI;
}

initializeWebUI().catch(console.error);
