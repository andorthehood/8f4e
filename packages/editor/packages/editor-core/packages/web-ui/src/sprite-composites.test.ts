import type { CompositeSprite } from '@8f4e/sprite-atlas-extender';
import { FontGlyph, resolveSpriteIds } from '@8f4e/sprite-generator';
import type { SpriteId, SpriteIdentifier } from 'glugglugglug';
import { describe, expect, it, vi } from 'vitest';
import { createIconSprites, Icon } from './icon-sprites';
import type { SpriteData } from './index';
import { extendEditorAtlas } from './sprite-composites';

const mocks = vi.hoisted(() => ({
	extendSpriteAtlas: vi.fn((source: SpriteData['spriteAtlas'], _composites: readonly CompositeSprite[]) => ({
		image: source.image,
		lookup: source.lookup,
	})),
}));
vi.mock('@8f4e/sprite-atlas-extender', () => ({ extendSpriteAtlas: mocks.extendSpriteAtlas }));

function source(width = 8, height = 16): SpriteData {
	return {
		characterWidth: width,
		characterHeight: height,
		spriteAtlas: {
			image: {} as OffscreenCanvas,
			lookup: {},
			spriteIdentifiers: {
				fillColors: { background: 1, backgroundDots: 2, backgroundDots2: 3 },
				iconFillColors: { inputConnectorBackground: 4, outputConnectorBackground: 5, switchBackground: 6 },
				fontInputConnector: { '[': 7, ']': 8, [FontGlyph.SWITCH_KNOB]: 9 },
				fontOutputConnector: { '[': 10, ']': 11 },
				feedbackGlyphs: { 0: 12, 1: 13 },
			} as SpriteData['spriteAtlas']['spriteIdentifiers'],
		},
	};
}

describe('editor sprite composites', () => {
	it.each([
		[8, 16],
		[6, 10],
	])('positions connector and switch glyphs in %sx%s cells', (width, height) => {
		const { composites, icons, feedbackScale } = createIconSprites(source(width, height));
		const target = { drawSprite: vi.fn() };
		const resolveSprite = (identifier: SpriteIdentifier) => (Number(identifier) + 100) as SpriteId;
		const draw = (id: string) => {
			target.drawSprite.mockClear();
			const sprite = composites.find(composite => composite.id === id)!;
			expect(sprite.height).toBe(height);
			sprite.draw(target, { resolveSprite });
			return target.drawSprite.mock.calls;
		};
		expect(draw(icons[Icon.INPUT])).toEqual([
			[0, 0, 104, width * 3, height],
			[0, 0, 107],
			[width * 2, 0, 108],
		]);
		expect(draw(icons[Icon.SWITCH_OFF])).toEqual([
			[0, 0, 106, width * 4, height],
			[0, 0, 107],
			[width, 0, 109],
			[width * 3, 0, 108],
		]);
		expect(draw(icons[Icon.SWITCH_ON])).toEqual([
			[0, 0, 106, width * 4, height],
			[0, 0, 107],
			[width * 2, 0, 109],
			[width * 3, 0, 108],
		]);
		expect(draw(feedbackScale[1]!)).toEqual([
			[0, 0, 105, width * 3, height],
			[0, 0, 110],
			[width, 0, 113],
			[width * 2, 0, 111],
		]);
	});

	it('bakes every composite together and preserves source groups without adding dot sprites', () => {
		const spriteData = source();
		const completed = extendEditorAtlas(spriteData);
		const [atlas, composites] = mocks.extendSpriteAtlas.mock.calls.at(-1)!;
		expect(atlas).toBe(spriteData.spriteAtlas);
		expect(composites.map(sprite => sprite.id)).toEqual([
			'web-ui:background',
			'web-ui:input',
			'web-ui:switch-off',
			'web-ui:switch-on',
			'web-ui:feedback:0',
			'web-ui:feedback:1',
		]);
		expect(completed.spriteIdentifiers.fillColors).toBe(spriteData.spriteAtlas.spriteIdentifiers.fillColors);
		expect(completed.spriteIdentifiers.fontInputConnector).toBe(
			spriteData.spriteAtlas.spriteIdentifiers.fontInputConnector
		);
		expect(completed.spriteIdentifiers).not.toHaveProperty('iconGlyphs');
		expect(completed.spriteIdentifiers).not.toHaveProperty('dots');
		expect(spriteData.spriteAtlas.spriteIdentifiers).not.toHaveProperty('icons');
		expect(spriteData.spriteAtlas.spriteIdentifiers).not.toHaveProperty('feedbackScale');
		const resolver = { resolveSprite: vi.fn((key: SpriteIdentifier) => String(key).length as SpriteId) };
		const resolved = resolveSpriteIds(completed.spriteIdentifiers, resolver);
		expect(resolver.resolveSprite).toHaveBeenCalledWith('web-ui:feedback:0');
		expect(resolved.feedbackScale[0]).toBeDefined();
		expect(resolved.feedbackScale[2]).toBeUndefined();
	});
});
