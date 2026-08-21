import generateSprite from '@8f4e/sprite-generator';
import { Engine } from 'glugglugglug';

const output = document.querySelector<HTMLCanvasElement>('#test-canvas');
if (!output) {
	throw new Error('Could not find the sprite atlas test canvas.');
}

const { characterHeight, characterWidth, spriteAtlas } = await generateSprite({ font: 'ibmvga8x16' });
const engine = new Engine(output, { initialCapacity: 4 });
const ids = spriteAtlas.spriteIds;

engine.setSpriteAtlas(spriteAtlas.image, spriteAtlas.lookup);
engine.renderFrame(() => {
	engine.drawSprite(0, 0, ids.fillColors.background, output.width, output.height);
	engine.drawSprite(32, 32, ids.fillColors.moduleBackground, 640, 208);

	for (const [index, character] of [...'SPRITE ATLAS'].entries()) {
		engine.drawSprite(
			48 + index * characterWidth * 2,
			48,
			ids.fontDialogTitle[character],
			characterWidth * 2,
			characterHeight * 2
		);
	}

	for (const [index, character] of [...'one atlas / numeric ids / one draw list'].entries()) {
		engine.drawSprite(48 + index * characterWidth, 112, ids.fontCode[character]);
	}

	for (const [index, character] of [...'sprite-generator atlas'].entries()) {
		engine.drawSprite(48 + index * characterWidth, 144, ids.fontCodeComment[character]);
	}

	engine.drawSprite(48, 184, ids.fillColors.highlightedCodeLine, 448, characterHeight);
	for (const [index, character] of [...'ordered and pixelated'].entries()) {
		engine.drawSprite(48 + index * characterWidth, 184, ids.fontInstruction[character]);
	}
});

document.body.dataset.ready = 'true';
