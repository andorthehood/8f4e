import type { EditorSpriteIdLookups } from '@8f4e/editor-state-types';
import { extendSpriteAtlas } from '@8f4e/sprite-atlas-extender';
import type { SpriteAtlas, SpriteIdentifiers } from '@8f4e/sprite-generator';
import { createBackgroundSprite } from './background-atlas';
import { createIconSprites } from './icon-sprites';
import type { SpriteData } from './index';

/** Bakes all editor composites in one pass before installing the completed atlas. */
export function extendEditorAtlas(spriteData: SpriteData): SpriteAtlas<SpriteIdentifiers<EditorSpriteIdLookups>> {
	const background = createBackgroundSprite(spriteData);
	const { composites, icons, feedbackScale } = createIconSprites(spriteData);
	const completed = extendSpriteAtlas(spriteData.spriteAtlas, [background, ...composites]);
	return {
		...completed,
		spriteIdentifiers: {
			...spriteData.spriteAtlas.spriteIdentifiers,
			background: { 0: background.id },
			icons,
			feedbackScale,
		},
	};
}
