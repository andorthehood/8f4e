import { Engine } from 'glugglug';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { SpriteLookups } from '@8f4e/sprite-generator';
import type { MemoryViews } from '../../../types';

function getPressedKeyOffsets(
	pressedKeysListMemory: CodeBlockGraphicData['widgets']['pianoKeyboards'][number]['pressedKeysListMemory'],
	pressedNumberOfKeysMemory: CodeBlockGraphicData['widgets']['pianoKeyboards'][number]['pressedNumberOfKeysMemory'],
	startingNumber: number,
	keyCount: number,
	memoryViews: MemoryViews
): Set<number> {
	const pressedKeys = new Set<number>();
	const memoryBuffer = pressedKeysListMemory.isInteger ? memoryViews.int32 : memoryViews.float32;
	const numberOfKeys = Math.max(0, memoryViews.int32[pressedNumberOfKeysMemory.wordAlignedAddress] || 0);
	const readableKeys = Math.min(numberOfKeys, pressedKeysListMemory.wordAlignedSize);

	for (let i = 0; i < readableKeys; i++) {
		const keyValue = memoryBuffer[pressedKeysListMemory.wordAlignedAddress + i];
		const keyOffset = Math.trunc(keyValue - startingNumber);

		if (keyOffset >= 0 && keyOffset < keyCount) {
			pressedKeys.add(keyOffset);
		}
	}

	return pressedKeys;
}

type PressedOverlayFont =
	CodeBlockGraphicData['widgets']['pianoKeyboards'][number]['keys'][number]['pressedOverlayFont'];

function setPressedOverlayLookup(engine: Engine, spriteLookups: SpriteLookups, font: PressedOverlayFont): void {
	engine.setSpriteLookup(spriteLookups[font]);
}

export default function drawer(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	for (const {
		x,
		y,
		keyWidth,
		keyY,
		keyHeight,
		blackKeyHeight,
		blackKeySideY,
		blackKeySideHeight,
		blackKeyGapXOffset,
		blackKeyGapY,
		blackKeyGapWidth,
		blackKeyGapHeight,
		keys,
		pressedKeys: sourcePressedKeys,
		pressedKeysListMemory,
		pressedNumberOfKeysMemory,
		startingNumber,
	} of codeBlock.widgets.pianoKeyboards) {
		const pressedKeys = getPressedKeyOffsets(
			pressedKeysListMemory,
			pressedNumberOfKeysMemory,
			startingNumber,
			keys.length,
			memoryViews
		);
		sourcePressedKeys.forEach(key => pressedKeys.add(key));

		engine.startGroup(x, y);
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);

		for (const key of keys) {
			if (key.isBlack) {
				engine.drawSprite(key.x, keyY, key.sprite, keyWidth, blackKeyHeight);
				engine.drawSprite(key.x, blackKeySideY, 'pianoKeyWhite', keyWidth, blackKeySideHeight);
				engine.drawSprite(key.x + blackKeyGapXOffset, blackKeyGapY, key.sprite, blackKeyGapWidth, blackKeyGapHeight);
			} else {
				engine.drawSprite(key.x, keyY, key.sprite, keyWidth, keyHeight);
			}
		}

		for (const key of keys) {
			if (pressedKeys.has(key.offset)) {
				setPressedOverlayLookup(engine, state.graphicHelper.spriteLookups, key.pressedOverlayFont);
				for (const y of key.pressedOverlayRows) {
					engine.drawText(key.pressedOverlayX, y, '//');
				}
			}
		}

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
		for (const key of keys) {
			engine.drawText(key.labelX, key.labelY, key.label);
		}
		engine.endGroup();
	}
}
