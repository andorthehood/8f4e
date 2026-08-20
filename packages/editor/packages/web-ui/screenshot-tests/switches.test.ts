import { createMockCodeBlock } from '@8f4e/editor-state-testing';
import init from '@8f4e/web-ui';
import { expect, test } from 'vitest';
import createCanvas from './utils/createCanvas';
import createMockMemoryViews from './utils/createMockMemoryViews';
import createMockSpriteData from './utils/createMockSpriteData';
import createMockStateWithColors from './utils/createMockStateWithColors';
import { resolveCodeWithOneColor } from './utils/generateColorMapMock';

test('switches', async () => {
	const canvas = createCanvas();
	const mockState = await createMockStateWithColors();
	const memoryViews = createMockMemoryViews();
	const spriteData = await createMockSpriteData(mockState);

	await init(mockState, canvas, memoryViews, spriteData);

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

	if (mockState.spriteLookups) {
		const lines1 = ['selected code block', '', '', '', '', '', '', '', ''];
		const codeToRender1 = resolveCodeWithOneColor(lines1, mockState.spriteLookups.fontCode);

		const codeBlockMock = createMockCodeBlock({
			x: 16,
			y: 16,
			width: 256,
			height: lines1.length * 16,
			codeToRender: codeToRender1,
			extras: {
				inputs: [],
				outputs: [],
				debuggers: [],
				switches: [],
				buttons,
				pianoKeyboards: [],
				arrayPlotters: [],
				errorMessages: [],
				blockHighlights: [],
			},
		});

		mockState.codeBlockRendering.selectedCodeBlock = codeBlockMock;

		mockState.codeBlockRendering.codeBlocks.push(codeBlockMock);

		const lines2 = ['not selected code block', '', '', '', '', '', '', '', ''];
		const codeToRender2 = resolveCodeWithOneColor(lines2, mockState.spriteLookups.fontCode);

		mockState.codeBlockRendering.codeBlocks.push(
			createMockCodeBlock({
				x: 288,
				y: 16,
				width: 256,
				height: lines2.length * 16,
				codeToRender: codeToRender2,
				extras: {
					inputs: [],
					outputs: [],
					debuggers: [],
					switches: [],
					buttons,
					pianoKeyboards: [],
					arrayPlotters: [],
					errorMessages: [],
					blockHighlights: [],
				},
			})
		);
	}

	await expect(canvas).toMatchScreenshot();
});
