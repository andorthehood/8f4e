import { Engine } from '@8f4e/2d-engine';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawer(engine: Engine, state: State, module: ModuleGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.pianoKeys);

	for (const [, { x, y, keyWidth, pressedKeys, startingNumber }] of module.pianoKeyboards) {
		engine.startGroup(x, y);

		for (let i = 0; i < 12; i++) {
			if (pressedKeys.has(i + startingNumber)) {
				engine.drawSprite(i * keyWidth, 0, i + 12);
			} else {
				engine.drawSprite(i * keyWidth, 0, i);
			}
		}

		engine.endGroup();
	}
}
