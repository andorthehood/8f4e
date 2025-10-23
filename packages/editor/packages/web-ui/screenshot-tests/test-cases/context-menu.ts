import init from '@8f4e/web-ui';

import generateStateMock from '../utils/generateStateMock';
import generateContextMenuMock from '../utils/generateContextMenuMock';

async function initializeWebUI() {
	const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
	if (!canvas) {
		throw new Error('Canvas element not found');
	}

	const mockState = generateStateMock();
	const webUI = await init(mockState, canvas);

	mockState.graphicHelper.contextMenu = generateContextMenuMock();

	console.log('Web-UI initialized:', webUI);
	return webUI;
}

initializeWebUI().catch(console.error);
