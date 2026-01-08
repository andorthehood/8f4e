import { expect, test } from 'vitest';
import init from '@8f4e/web-ui';

import createMockStateWithColors from './utils/createMockStateWithColors';
import generateContextMenuMock from './utils/generateContextMenuMock';
import createCanvas from './utils/createCanvas';
import createMockMemoryViews from './utils/createMockMemoryViews';
import createMockSpriteData from './utils/createMockSpriteData';

test('context menu', async () => {
	const canvas = createCanvas();
	const mockState = createMockStateWithColors();
	const memoryViews = createMockMemoryViews();
	const spriteData = createMockSpriteData(mockState);

	// Update state with sprite data before init
	mockState.graphicHelper.spriteLookups = spriteData.spriteLookups;
	mockState.graphicHelper.viewport.hGrid = spriteData.characterHeight;
	mockState.graphicHelper.viewport.vGrid = spriteData.characterWidth;

	await init(mockState, canvas, memoryViews, spriteData);
	mockState.graphicHelper.contextMenu = generateContextMenuMock();
	await expect(canvas).toMatchScreenshot();
});
