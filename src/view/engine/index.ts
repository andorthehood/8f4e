import { Engine } from '../../../packages/2dEngine/src';

function random(max) {
	return Math.floor(Math.random() * max);
}

export default class GlitchedEngine extends Engine {
	random = 0;
	counter = 0;

	drawText(posX, posY, text, font, letterSpacing = 1) {
		for (let i = 0; i < text.length; i++) {
			const { x, y, spriteWidth, spriteHeight } = this.spriteLookup(text[i]);

			if (this.random === text[i].charCodeAt(0)) {
				this.drawSpriteFromCoordinates(
					posX + i * (spriteWidth + letterSpacing),
					posY,
					spriteWidth,
					spriteHeight,
					x,
					y + 100
				);
			} else {
				this.drawSpriteFromCoordinates(posX + i * (spriteWidth + letterSpacing), posY, spriteWidth, spriteHeight, x, y);
			}
		}

		this.counter++;

		if (this.counter === 400) {
			this.random = random(128);
			this.counter = 0;
		}
	}
}
