import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { SpriteIdLookups } from '@8f4e/sprite-generator';
import type { DrawContext } from '../../../drawContext';
import type { MemoryViews } from '../../../types';

type PianoKeyboardData = CodeBlockGraphicData['widgets']['pianoKeyboards'][number];
type PianoKeyboardKey = PianoKeyboardData['keys'][number];

function drawPressedKey(engine: DrawContext, spriteLookups: SpriteIdLookups, key: PianoKeyboardKey): void {
	for (const y of key.pressedOverlayRows) {
		engine.drawText(key.pressedOverlayX, y, '//', spriteLookups[key.pressedOverlayFont]);
	}
}

function drawPressedKeyOffset(
	engine: DrawContext,
	spriteLookups: SpriteIdLookups,
	keys: PianoKeyboardData['keys'],
	keyOffset: number
): void {
	const key = keys[keyOffset];
	if (!key) {
		return;
	}

	drawPressedKey(engine, spriteLookups, key);
}

function drawRuntimePressedKeys(
	engine: DrawContext,
	spriteLookups: SpriteIdLookups,
	keys: PianoKeyboardData['keys'],
	pressedKeysListMemory: CodeBlockGraphicData['widgets']['pianoKeyboards'][number]['pressedKeysListMemory'],
	pressedNumberOfKeysMemory: CodeBlockGraphicData['widgets']['pianoKeyboards'][number]['pressedNumberOfKeysMemory'],
	startingNumber: number,
	memoryViews: MemoryViews
): void {
	const memoryBuffer = pressedKeysListMemory.isInteger ? memoryViews.int32 : memoryViews.float32;
	const numberOfKeys = Math.max(0, memoryViews.int32[pressedNumberOfKeysMemory.wordAlignedAddress] || 0);
	const readableKeys = Math.min(numberOfKeys, pressedKeysListMemory.wordAlignedSize);

	for (let i = 0; i < readableKeys; i++) {
		const keyValue = memoryBuffer[pressedKeysListMemory.wordAlignedAddress + i];
		const keyOffset = Math.trunc(keyValue - startingNumber);

		if (keyOffset >= 0 && keyOffset < keys.length) {
			drawPressedKeyOffset(engine, spriteLookups, keys, keyOffset);
		}
	}
}

export default function drawer(
	engine: DrawContext,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.spriteLookups) {
		return;
	}
	const spriteLookups = state.spriteLookups;

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
		pressedKeysListMemory,
		pressedNumberOfKeysMemory,
		startingNumber,
	} of codeBlock.widgets.pianoKeyboards) {
		engine.pushOffset(x, y);

		for (const key of keys) {
			if (key.kind === 'black') {
				engine.drawSprite(key.x, keyY, spriteLookups.fillColors[key.sprite], keyWidth, blackKeyHeight);
				engine.drawSprite(key.x, blackKeySideY, spriteLookups.fillColors.pianoKeyWhite, keyWidth, blackKeySideHeight);
				engine.drawSprite(
					key.x + blackKeyGapXOffset,
					blackKeyGapY,
					spriteLookups.fillColors[key.sprite],
					blackKeyGapWidth,
					blackKeyGapHeight
				);
			} else {
				engine.drawSprite(key.x, keyY, spriteLookups.fillColors[key.sprite], keyWidth, keyHeight);
			}
		}

		drawRuntimePressedKeys(
			engine,
			spriteLookups,
			keys,
			pressedKeysListMemory,
			pressedNumberOfKeysMemory,
			startingNumber,
			memoryViews
		);

		for (const key of keys) {
			engine.drawText(key.labelX, key.labelY, key.label, spriteLookups.fontCode);
		}
		engine.popOffset();
	}
}
