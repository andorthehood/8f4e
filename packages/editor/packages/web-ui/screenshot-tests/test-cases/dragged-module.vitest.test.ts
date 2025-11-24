import { test, expect } from 'vitest';
import init from '@8f4e/web-ui';
import { createMockCodeBlock } from '@8f4e/editor-state/testing';

import createMockStateWithColors from '../utils/createMockStateWithColors';
import { generateColorMapWithAllColors } from '../utils/generateColorMapMock';

// Time to wait for rendering to complete before taking screenshot
const RENDERING_WAIT_MS = 2000;

test('should display web-ui canvas renderer for dragged-module', async () => {
	// Create canvas element
	const canvas = document.createElement('canvas');
	canvas.id = 'test-canvas';
	canvas.width = 1024;
	canvas.height = 768;
	document.body.appendChild(canvas);

	try {
		// Initialize web UI
		const mockState = createMockStateWithColors();
		await init(mockState, canvas);

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

		// Wait for rendering to complete
		await new Promise(resolve => setTimeout(resolve, RENDERING_WAIT_MS));

		// Take screenshot and compare
		await expect.element(canvas).toMatchScreenshot('dragged-module.png');
	} finally {
		// Cleanup
		document.body.removeChild(canvas);
	}
});
