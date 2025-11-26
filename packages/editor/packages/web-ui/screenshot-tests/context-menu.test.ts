import { expect, test } from 'vitest';
import init from '@8f4e/web-ui';

import createMockStateWithColors from './utils/createMockStateWithColors';
import generateContextMenuMock from './utils/generateContextMenuMock';
import createCanvas from './utils/createCanvas';

test('context menu', async () => {
	const canvas = createCanvas();
	const mockState = createMockStateWithColors();
	await init(mockState, canvas);
	mockState.graphicHelper.contextMenu = generateContextMenuMock();
	await expect(canvas).toMatchScreenshot();
});
