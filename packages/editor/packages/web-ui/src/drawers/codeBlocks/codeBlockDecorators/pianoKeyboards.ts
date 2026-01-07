import { Engine } from 'glugglug';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state';
import type { MemoryViews } from '../../../types';

export default function drawer(
	engine: Engine,
	state: State,
	codeBlock: CodeBlockGraphicData,
	memoryViews: MemoryViews
): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.pianoKeys);

	for (const { x, y, keyWidth, pressedKeysListMemory, pressedNumberOfKeysMemory, startingNumber } of codeBlock.extras
		.pianoKeyboards) {
		engine.startGroup(x, y);

		const memoryBuffer = pressedKeysListMemory.isInteger ? memoryViews.int32 : memoryViews.float32;

		const numberOfKeys = memoryViews.int32[pressedNumberOfKeysMemory.wordAlignedAddress];

		for (let i = 0; i < 24; i++) {
			engine.drawSprite(i * keyWidth, 0, i % 12);
		}

		for (let i = 0; i < numberOfKeys; i++) {
			const keyValue = memoryBuffer[pressedKeysListMemory.wordAlignedAddress + i];
			if (keyValue - startingNumber >= 24 || keyValue - startingNumber < 0) {
				continue;
			}
			engine.drawSprite((keyValue - startingNumber) * keyWidth, 0, ((keyValue - startingNumber) % 12) + 12);
		}

		engine.endGroup();
	}
}
