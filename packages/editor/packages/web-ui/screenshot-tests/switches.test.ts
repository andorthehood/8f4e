import { expect, test } from 'vitest';
import init from '@8f4e/web-ui';
import { createMockCodeBlock } from '@8f4e/editor-state/testing';

import createMockStateWithColors from './utils/createMockStateWithColors';
import createCanvas from './utils/createCanvas';
import { generateColorMapWithOneColor } from './utils/generateColorMapMock';
import createMockMemoryRef from './utils/createMockMemoryRef';

test('switches', async () => {
	const canvas = createCanvas();
	const mockState = createMockStateWithColors();
	const memoryRef = createMockMemoryRef();
	await init(mockState, canvas, memoryRef);

	const buttons = [
		{
			width: 32,
			height: 16,
			x: 100,
			y: 100,
			id: 'set',
			offValue: 0,
			onValue: 1,
		},
	];

	if (mockState.graphicHelper.spriteLookups) {
		const lines1 = ['selected code block', '', '', '', '', '', '', '', ''];
		const codeToRender1 = lines1.map(line => line.split('').map(char => char.charCodeAt(0)));

		const codeBlockMock = createMockCodeBlock({
			x: 16,
			y: 16,
			width: 256,
			height: lines1.length * 16,
			codeToRender: codeToRender1,
			codeColors: generateColorMapWithOneColor(mockState.graphicHelper.spriteLookups.fontCode, 10),
			extras: {
				inputs: [],
				outputs: [],
				debuggers: [],
				switches: [],
				buttons,
				pianoKeyboards: [],
				bufferPlotters: [],
				errorMessages: [],
				blockHighlights: [],
			},
		});

		mockState.graphicHelper.selectedCodeBlock = codeBlockMock;

		mockState.graphicHelper.codeBlocks.push(codeBlockMock);

		const lines2 = ['not selected code block', '', '', '', '', '', '', '', ''];
		const codeToRender2 = lines2.map(line => line.split('').map(char => char.charCodeAt(0)));

		mockState.graphicHelper.codeBlocks.push(
			createMockCodeBlock({
				x: 288,
				y: 16,
				width: 256,
				height: lines2.length * 16,
				codeToRender: codeToRender2,
				codeColors: generateColorMapWithOneColor(mockState.graphicHelper.spriteLookups.fontCode, 10),
				extras: {
					inputs: [],
					outputs: [],
					debuggers: [],
					switches: [],
					buttons,
					pianoKeyboards: [],
					bufferPlotters: [],
					errorMessages: [],
					blockHighlights: [],
				},
			})
		);
	}

	await expect(canvas).toMatchScreenshot();
});
