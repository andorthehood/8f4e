import { type CompositeSprite, extendSpriteAtlas } from '@8f4e/sprite-atlas-extender';
import type { SpriteAtlas, SpriteIdentifierLookups } from '@8f4e/sprite-generator';
import type { SpriteData } from './index';

const BACKGROUND_COLUMNS = 64;
const BACKGROUND_ROWS = 32;
const DOT_SIZE = 2;
const BACKGROUND_IDENTIFIER = 'web-ui:background';

type BackgroundIdentifiers = SpriteIdentifierLookups & { background: Record<0, string> };

/** Adds the editor's repeating background tile to the base generated sprites. */
export function extendBackgroundAtlas(spriteData: SpriteData): SpriteAtlas<BackgroundIdentifiers> {
	const { characterWidth, characterHeight, spriteAtlas } = spriteData;
	const width = BACKGROUND_COLUMNS * characterWidth;
	const height = BACKGROUND_ROWS * characterHeight;
	const dotOffsetX = Math.floor((characterWidth - DOT_SIZE) / 2);
	const dotOffsetY = Math.floor((characterHeight - DOT_SIZE) / 2);
	const composite: CompositeSprite = {
		id: BACKGROUND_IDENTIFIER,
		width,
		height,
		draw: (target, sprites) => {
			const identifiers = spriteAtlas.spriteIdentifiers;
			const background = sprites.resolveSprite(identifiers.fillColors.background);
			const normalDot = sprites.resolveSprite(identifiers.fillColors.backgroundDots);
			const alternateDot = sprites.resolveSprite(identifiers.fillColors.backgroundDots2);
			target.drawSprite(0, 0, background, width, height);
			for (let row = 0; row < BACKGROUND_ROWS; row++) {
				for (let column = 0; column < BACKGROUND_COLUMNS; column++) {
					target.drawSprite(
						column * characterWidth + dotOffsetX,
						row * characterHeight + dotOffsetY,
						column % 2 === 0 ? alternateDot : normalDot,
						DOT_SIZE,
						DOT_SIZE
					);
				}
			}
		},
	};
	const completed = extendSpriteAtlas(spriteAtlas, [composite]);
	return {
		...completed,
		spriteIdentifiers: {
			...spriteAtlas.spriteIdentifiers,
			background: { 0: BACKGROUND_IDENTIFIER },
		},
	};
}
