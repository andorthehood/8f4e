import { describe, test, expect } from 'vitest';
import init from '@8f4e/web-ui';
import { createMockCodeBlock } from '@8f4e/editor-state/testing';

import createMockStateWithColors from './utils/createMockStateWithColors';
import { generateColorMapWithOneColor, generateColorMapWithAllColors } from './utils/generateColorMapMock';
import generateContextMenuMock from './utils/generateContextMenuMock';

async function initFontColorRendering(canvas: HTMLCanvasElement) {
	const mockState = createMockStateWithColors();
	await init(mockState, canvas);

	const allCharacters = Array.from({ length: 128 }, (_, i) => String.fromCharCode(i));

	// split into 16 characters per line
	const lines = allCharacters.reduce<string[][]>((acc, char, index) => {
		if (index % 16 === 0) {
			acc.push([] as string[]);
		}
		acc[acc.length - 1].push(char);
		return acc;
	}, []);

	const colors = [
		'fontBinaryOne',
		'fontBinaryZero',
		'fontCode',
		'fontCodeComment',
		'fontDialogText',
		'fontDialogTitle',
		'fontInstruction',
		'fontLineNumber',
		'fontMenuItemText',
		'fontMenuItemTextHighlighted',
		'fontNumbers',
	];

	colors.forEach((colorName, index) => {
		if (!mockState.graphicHelper.spriteLookups?.[colorName]) {
			return;
		}

		const color = mockState.graphicHelper.spriteLookups[colorName];
		const codeLines = ['', colorName, ...lines.map(line => line.join('')), ''];
		const codeToRender = codeLines.map(line => line.split('').map(char => char.charCodeAt(0)));

		mockState.graphicHelper.codeBlocks.add(
			createMockCodeBlock({
				id: `codeBlock${index}`,
				x: (index % 4) * 8 * 32,
				y: 16 * 12 * Math.floor(index / 4),
				width: 256,
				height: codeLines.length * 16,
				codeToRender,
				codeColors: generateColorMapWithOneColor(color, 10),
			})
		);
	});
}

async function initDraggedModule(canvas: HTMLCanvasElement) {
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
		mockState.graphicHelper.codeBlocks.add(codeBlockMock);
	}
}

async function initContextMenu(canvas: HTMLCanvasElement) {
	const mockState = createMockStateWithColors();
	await init(mockState, canvas);
	mockState.graphicHelper.contextMenu = generateContextMenuMock();
}

const testCases = [
	{ name: 'font-color-rendering', init: initFontColorRendering },
	{ name: 'dragged-module', init: initDraggedModule },
	{ name: 'context-menu', init: initContextMenu },
];

describe('Web-UI Screenshot Tests', () => {
	for (const testCase of testCases) {
		test(`should display web-ui canvas renderer for ${testCase.name}`, async () => {
			// Create canvas element in the test
			const canvas = document.createElement('canvas');
			canvas.id = 'test-canvas';
			canvas.width = 1024;
			canvas.height = 768;
			document.body.appendChild(canvas);

			try {
				// Initialize the test case
				await testCase.init(canvas);

				// Wait for rendering to complete
				await new Promise(resolve => setTimeout(resolve, 2000));

				// Take screenshot and compare
				await expect.element(canvas).toMatchScreenshot(`${testCase.name}.png`);
			} finally {
				// Cleanup
				document.body.removeChild(canvas);
			}
		});
	}
});
