import { expect, test } from 'vitest';
import init from '@8f4e/web-ui';
import { createMockCodeBlock } from '@8f4e/editor-state/testing';

import createMockStateWithColors from './utils/createMockStateWithColors';
import createCanvas from './utils/createCanvas';
import { generateColorMapWithAllColors } from './utils/generateColorMapMock';

test('dragged module', async () => {
	const canvas = createCanvas();
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

		mockState.graphicHelper.codeBlocks.push(codeBlockMock);
	}

	await expect(canvas).toMatchScreenshot();
});
