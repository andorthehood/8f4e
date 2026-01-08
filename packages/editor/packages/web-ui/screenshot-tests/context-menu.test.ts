import { expect, test } from 'vitest';
import init from '@8f4e/web-ui';

import createMockStateWithColors from './utils/createMockStateWithColors';
import generateContextMenuMock from './utils/generateContextMenuMock';
import createCanvas from './utils/createCanvas';
import createMockMemoryViews from './utils/createMockMemoryViews';

test('context menu', async () => {
	const canvas = createCanvas();
	const mockState = createMockStateWithColors();
	const memoryViews = createMockMemoryViews();
	await init(mockState, canvas, memoryViews);
	mockState.graphicHelper.contextMenu = generateContextMenuMock();
	await expect(canvas).toMatchScreenshot();
});
