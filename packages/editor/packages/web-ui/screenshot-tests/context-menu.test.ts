import { expect, test } from 'vitest';
import init from '@8f4e/web-ui';

import createMockStateWithColors from './utils/createMockStateWithColors';
import generateContextMenuMock from './utils/generateContextMenuMock';
import createCanvas from './utils/createCanvas';
import createMockMemoryViews from './utils/createMockMemoryViews';
import createMockSpriteData from './utils/createMockSpriteData';

test('context menu', async () => {
	const canvas = createCanvas();
	const mockState = await createMockStateWithColors();
	const memoryViews = createMockMemoryViews();
	const spriteData = await createMockSpriteData(mockState);

	await init(mockState, canvas, memoryViews, spriteData);
	mockState.graphicHelper.contextMenu = generateContextMenuMock();
	await expect(canvas).toMatchScreenshot();
});
