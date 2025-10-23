import init from '@8f4e/web-ui';

import generateCodeBlockMock from './utils/generateCodeBlockMock';
import generateStateMock from './utils/generateStateMock';
import generateColorMapMock from './utils/generateColorMapMock';

async function initializeWebUI() {
	const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
	if (!canvas) {
		throw new Error('Canvas element not found');
	}

	const mockState = generateStateMock();
	const webUI = await init(mockState, canvas);

	if (mockState.graphicHelper.spriteLookups) {
		mockState.graphicHelper.activeViewport.codeBlocks.add(
			generateCodeBlockMock(
				[
					'',
					'lorem ipsum dolor sit amet',
					'consectetur adipiscing elit',
					'sed do eiusmod tempor',
					'ut enim ad minim veniam',
					'quis nostrud exercitation',
					'',
				],
				generateColorMapMock(mockState.graphicHelper.spriteLookups)
			)
		);
	}

	console.log('Web-UI initialized:', webUI);
	return webUI;
}

initializeWebUI().catch(console.error);
