import { createMockCodeBlock } from '@8f4e/editor-state-testing';
import init from '@8f4e/web-ui';
import type { CodeBlockRenderData, WebUiRenderDataSource } from '@8f4e/web-ui-render-projection';
import { expect, test, vi } from 'vitest';
import createCanvas from './utils/createCanvas';
import createMockMemoryViews from './utils/createMockMemoryViews';
import createMockSpriteData from './utils/createMockSpriteData';
import createMockStateWithColors from './utils/createMockStateWithColors';
import { resolveCodeWithOneColor } from './utils/generateColorMapMock';

test('sliders', async () => {
	const canvas = createCanvas();
	const mockState = createMockStateWithColors({
		editorConfig: {
			color: {
				text: { sliderHandle: '#ffcc00' },
				fill: {
					track: '#111111',
					fill: '#cccccc',
					handle: '#336699',
				},
			},
		},
	});
	const memoryViews = createMockMemoryViews();
	const spriteData = await createMockSpriteData(mockState);
	const codeBlocks = new Map<number, CodeBlockRenderData>();
	const renderData: WebUiRenderDataSource = { getSnapshot: () => ({ codeBlocks }) };
	const renderer = await init(mockState, renderData, canvas, memoryViews, spriteData);

	memoryViews.float32.set([0, 0.5, 1]);

	if (mockState.spriteLookups) {
		const lines = ['slider handles', '', '', '', '', '', '', '', '', ''];
		const codeBlock = createMockCodeBlock({
			creationIndex: 0,
			x: 16,
			y: 16,
			width: 256,
			height: lines.length * 16,
		});
		codeBlock.widgets.sliders = [0, 1, 2].map((allocationUnitAddress, index) => ({
			moduleId: 'test',
			x: 16,
			y: 32 + index * 40,
			width: 96,
			height: 32,
			id: `slider-${index}`,
			allocationUnitAddress,
			byteAddress: allocationUnitAddress * 4,
			isInteger: false,
			isFloat64: false,
			min: 0,
			max: 1,
		}));

		mockState.codeBlockRendering.selectedCodeBlock = codeBlock;
		mockState.codeBlockRendering.codeBlocks.push(codeBlock);
		codeBlocks.set(codeBlock.creationIndex, {
			codeCells: resolveCodeWithOneColor(lines, mockState.spriteLookups.fontCode),
		});
	}

	renderer.pauseRendering();
	const now = vi.spyOn(performance, 'now').mockReturnValue(0);
	try {
		renderer.renderFrame();
		await expect(canvas).toMatchScreenshot();
	} finally {
		now.mockRestore();
		renderer.destroy();
	}
});
