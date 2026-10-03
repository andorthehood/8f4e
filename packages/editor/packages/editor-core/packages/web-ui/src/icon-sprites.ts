import type { CompositeSprite } from '@8f4e/sprite-atlas-extender';
import type { SpriteIdentifier } from 'glugglugglug';
import type { SpriteData } from './index';

export const Icon = {
	INPUT: 0,
	SWITCH_OFF: 1,
	SWITCH_ON: 2,
} as const;

/** Defines editor icons using only single-cell glyphs and fills from the source atlas. */
export function createIconSprites({ characterWidth, characterHeight, spriteAtlas }: SpriteData) {
	const { iconFillColors: fills, iconGlyphs: glyphs, feedbackGlyphs } = spriteAtlas.spriteIdentifiers;
	const icons = {
		[Icon.INPUT]: 'web-ui:input',
		[Icon.SWITCH_OFF]: 'web-ui:switch-off',
		[Icon.SWITCH_ON]: 'web-ui:switch-on',
	};
	function defineSprite(
		id: string,
		columns: number,
		background: SpriteIdentifier,
		characters: ReadonlyArray<readonly [column: number, identifier: SpriteIdentifier]>
	): CompositeSprite {
		return {
			id,
			width: columns * characterWidth,
			height: characterHeight,
			draw: (target, sprites) => {
				target.drawSprite(0, 0, sprites.resolveSprite(background), columns * characterWidth, characterHeight);
				for (const [column, identifier] of characters) {
					target.drawSprite(column * characterWidth, 0, sprites.resolveSprite(identifier));
				}
			},
		};
	}
	const composites = [
		defineSprite(icons[Icon.INPUT], 3, fills.inputConnectorBackground, [
			[0, glyphs.inputLeftBracket],
			[2, glyphs.inputRightBracket],
		]),
		defineSprite(icons[Icon.SWITCH_OFF], 4, fills.switchBackground, [
			[0, glyphs.inputLeftBracket],
			[1, glyphs.switchKnob],
			[3, glyphs.inputRightBracket],
		]),
		defineSprite(icons[Icon.SWITCH_ON], 4, fills.switchBackground, [
			[0, glyphs.inputLeftBracket],
			[2, glyphs.switchKnob],
			[3, glyphs.inputRightBracket],
		]),
	];
	const feedbackScale = Object.fromEntries(
		Object.entries(feedbackGlyphs).flatMap(([index, identifier]) => {
			if (identifier === undefined) return [];
			const id = `web-ui:feedback:${index}`;
			composites.push(
				defineSprite(id, 3, fills.outputConnectorBackground, [
					[0, glyphs.outputLeftBracket],
					[1, identifier],
					[2, glyphs.outputRightBracket],
				])
			);
			return [[index, id]];
		})
	) as Partial<Record<number, string>> & { readonly 0: string };
	return { composites, icons, feedbackScale };
}
