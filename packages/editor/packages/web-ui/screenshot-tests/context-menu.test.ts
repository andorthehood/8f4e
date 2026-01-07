import { expect, test } from 'vitest';
import init from '@8f4e/web-ui';

import createMockStateWithColors from './utils/createMockStateWithColors';
import generateContextMenuMock from './utils/generateContextMenuMock';
import createCanvas from './utils/createCanvas';
import createMockMemoryRef from './utils/createMockMemoryRef';

test('context menu', async () => {
	const canvas = createCanvas();
	const mockState = createMockStateWithColors();
	const memoryRef = createMockMemoryRef();
	await init(mockState, canvas, memoryRef);
	mockState.graphicHelper.contextMenu = generateContextMenuMock();
	await expect(canvas).toMatchScreenshot();
});
