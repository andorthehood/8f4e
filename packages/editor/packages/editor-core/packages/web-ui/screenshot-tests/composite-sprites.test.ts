import generateSprite, { type ColorSchemeOverrides, resolveSpriteIds } from '@8f4e/sprite-generator';
import { Engine } from 'glugglugglug';
import { expect, test } from 'vitest';
import { Icon } from '../src/icon-sprites';
import { extendEditorAtlas } from '../src/sprite-composites';

const themes: ColorSchemeOverrides[] = [
	{},
	{
		icons: {
			inputConnector: '#44dd88',
			outputConnector: '#ffaa33',
			inputConnectorBackground: 'rgba(80, 30, 90, 0.5)',
			outputConnectorBackground: 'rgba(20, 60, 90, 0.5)',
			switchBackground: 'rgba(90, 30, 20, 0.5)',
			feedbackScale0: '#00ffff',
			feedbackScale1: '#ff00ff',
			feedbackScale2: '#ffff00',
			feedbackScale3: '#ff8800',
			feedbackScale4: '#88ff00',
			feedbackScale5: '#0088ff',
		},
	},
];

test.each(['ibmvga8x16', '6x10'])('composite sprites with %s font and theme colors', async font => {
	const output = document.createElement('canvas');
	output.style.background = '#242424';
	const frames: HTMLCanvasElement[] = [];
	try {
		for (const colorScheme of themes) {
			const spriteData = await generateSprite({ font, colorScheme });
			const { characterWidth, characterHeight } = spriteData;
			const spriteAtlas = extendEditorAtlas(spriteData);
			const frame = document.createElement('canvas');
			frame.width = characterWidth * 18;
			frame.height = characterHeight * 2;
			const engine = new Engine(frame);
			try {
				const resolver = engine.setSpriteAtlas(spriteAtlas.image, spriteAtlas.lookup);
				const sprites = resolveSpriteIds(spriteAtlas.spriteIdentifiers, resolver);
				engine.renderFrame(() => {
					engine.drawSprite(0, 0, sprites.icons[Icon.INPUT]);
					engine.drawSprite(characterWidth * 4, 0, sprites.icons[Icon.SWITCH_OFF]);
					engine.drawSprite(characterWidth * 9, 0, sprites.icons[Icon.SWITCH_ON]);
					for (let index = 0; index < 6; index++) {
						engine.drawSprite(characterWidth * index * 3, characterHeight, sprites.feedbackScale[index]!);
					}
				});
				if (frames.length === 0) {
					output.width = frame.width;
					output.height = frame.height * themes.length;
				}
				output.getContext('2d')!.drawImage(frame, 0, frame.height * frames.length);
				frames.push(frame);
			} finally {
				engine.destroy();
				engine.gl.getExtension('WEBGL_lose_context')?.loseContext();
			}
		}
		document.body.appendChild(output);
		await expect(output).toMatchScreenshot(`composite-sprites-${font}`);
	} finally {
		output.remove();
	}
});
