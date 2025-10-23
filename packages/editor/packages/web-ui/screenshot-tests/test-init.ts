import init from '@8f4e/web-ui';

import generateCodeBlockMock from './utils/generateCodeBlockMock';
import generateStateMock from './utils/generateStateMock';

async function initializeWebUI() {
	const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
	if (!canvas) {
		throw new Error('Canvas element not found');
	}

	const mockState = generateStateMock(generateCodeBlockMock());
	const webUI = await init(mockState, canvas);
	console.log('Web-UI initialized:', webUI);
	return webUI;
}

initializeWebUI().catch(console.error);
