import { Engine } from '@8f4e/2d-engine';

import { CodeBlockGraphicData, State } from '../../../state/types';

export default function drawer(engine: Engine, state: State, module: CodeBlockGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.pianoKeys);

	for (const [
		,
		{ x, y, keyWidth, pressedKeysListMemory, pressedNumberOfKeysMemory, startingNumber },
	] of module.pianoKeyboards) {
		engine.startGroup(x, y);

		const memoryBuffer = pressedKeysListMemory.isInteger
			? state.compiler.memoryBuffer
			: state.compiler.memoryBufferFloat;

		const numberOfKeys = state.compiler.memoryBuffer[pressedNumberOfKeysMemory.wordAddress];

		for (let i = 0; i < 24; i++) {
			engine.drawSprite(i * keyWidth, 0, i % 12);
		}

		for (let i = 0; i < numberOfKeys; i++) {
			const keyValue = memoryBuffer[pressedKeysListMemory.wordAddress + i];
			if (keyValue - startingNumber >= 24 || keyValue - startingNumber < 0) {
				continue;
			}
			engine.drawSprite((keyValue - startingNumber) * keyWidth, 0, ((keyValue - startingNumber) % 12) + 12);
		}

		engine.endGroup();
	}
}
