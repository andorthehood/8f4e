import { test, expect } from 'vitest';
import init from '@8f4e/web-ui';

import createMockStateWithColors from '../utils/createMockStateWithColors';
import generateContextMenuMock from '../utils/generateContextMenuMock';

// Time to wait for rendering to complete before taking screenshot
const RENDERING_WAIT_MS = 2000;

test('should display web-ui canvas renderer for context-menu', async () => {
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

		mockState.graphicHelper.contextMenu = generateContextMenuMock();

		// Wait for rendering to complete
		await new Promise(resolve => setTimeout(resolve, RENDERING_WAIT_MS));

		// Take screenshot and compare
		await expect.element(canvas).toMatchScreenshot('context-menu.png');
	} finally {
		// Cleanup
		document.body.removeChild(canvas);
	}
});
