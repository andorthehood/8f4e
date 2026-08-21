import type { CodeBlockRenderData, EditorRenderDataSource } from '@8f4e/editor-render-projection';
import { createMockCodeBlock } from '@8f4e/editor-state-testing';
import init from '@8f4e/web-ui';
import { expect, test } from 'vitest';
import createCanvas from './utils/createCanvas';
import createMockMemoryViews from './utils/createMockMemoryViews';
import createMockSpriteData from './utils/createMockSpriteData';
import createMockStateWithColors from './utils/createMockStateWithColors';
import { resolveCodeWithAllColors } from './utils/generateColorMapMock';

test('dragged module', async () => {
	const canvas = createCanvas();
	const mockState = await createMockStateWithColors();
	const memoryViews = createMockMemoryViews();
	const spriteData = await createMockSpriteData(mockState);
	const codeBlocks = new Map<number, CodeBlockRenderData>();
	const renderData: EditorRenderDataSource = { getSnapshot: () => ({ codeBlocks }) };

	await init(mockState, renderData, canvas, memoryViews, spriteData);

	if (mockState.spriteLookups) {
		const codeLines = [
			'',
			'lorem ipsum dolor sit amet',
			'consectetur adipiscing elit',
			'sed do eiusmod tempor',
			'ut enim ad minim veniam',
			'quis nostrud exercitation',
			'',
		];
		const codeToRender = resolveCodeWithAllColors(codeLines, mockState.spriteLookups);

		const codeBlockMock = createMockCodeBlock({
			x: 16,
			y: 16,
			width: 256,
			height: codeLines.length * 16,
		});

		mockState.codeBlockRendering.draggedCodeBlock = codeBlockMock;

		mockState.codeBlockRendering.codeBlocks.push(codeBlockMock);
		codeBlocks.set(codeBlockMock.creationIndex, { codeCells: codeToRender });
	}

	await expect(canvas).toMatchScreenshot();
});
