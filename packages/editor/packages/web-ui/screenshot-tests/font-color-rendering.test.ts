import { expect, test } from 'vitest';
import init from '@8f4e/web-ui';
import { createMockCodeBlock } from '@8f4e/editor-state/testing';

import createMockStateWithColors from './utils/createMockStateWithColors';
import createCanvas from './utils/createCanvas';
import { generateColorMapWithOneColor } from './utils/generateColorMapMock';

test('font color rendering', async () => {
	const canvas = createCanvas();
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

		mockState.graphicHelper.codeBlocks.push(
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

	await expect(canvas).toMatchScreenshot();
});
