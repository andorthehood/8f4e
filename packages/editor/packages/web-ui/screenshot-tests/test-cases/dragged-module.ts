import init from '@8f4e/web-ui';
import { createMockCodeBlock } from '@8f4e/editor-state/testing';

import createMockStateWithColors from '../utils/createMockStateWithColors';
import { generateColorMapWithAllColors } from '../utils/generateColorMapMock';

async function initializeWebUI() {
	const canvas = document.getElementById('test-canvas') as HTMLCanvasElement;
	if (!canvas) {
		throw new Error('Canvas element not found');
	}

	const mockState = createMockStateWithColors();
	const webUI = await init(mockState, canvas);

	if (mockState.graphicHelper.spriteLookups) {
		const codeLines = [
			'',
			'lorem ipsum dolor sit amet',
			'consectetur adipiscing elit',
			'sed do eiusmod tempor',
			'ut enim ad minim veniam',
			'quis nostrud exercitation',
			'',
		];
		const codeToRender = codeLines.map(line => line.split('').map(char => char.charCodeAt(0)));

		const codeBlockMock = createMockCodeBlock({
			x: 16,
			y: 16,
			width: 256,
			height: codeLines.length * 16,
			codeToRender,
			codeColors: generateColorMapWithAllColors(mockState.graphicHelper.spriteLookups),
		});

		mockState.graphicHelper.draggedCodeBlock = codeBlockMock;

		mockState.graphicHelper.codeBlocks.add(codeBlockMock);
	}

	console.log('Web-UI initialized:', webUI);
	return webUI;
}

initializeWebUI().catch(console.error);
