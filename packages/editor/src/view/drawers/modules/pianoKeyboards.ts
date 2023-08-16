import { Engine } from '@8f4e/2d-engine';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawer(engine: Engine, state: State, module: ModuleGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.pianoKeys);

	for (const [, { x, y, keyWidth, pressedKeys }] of module.pianoKeyboards) {
		engine.startGroup(x, y);

		for (let i = 0; i < 24; i++) {
			if (pressedKeys.has(i)) {
				engine.drawSprite(i * keyWidth, 0, (i % 12) + 12);
			} else {
				engine.drawSprite(i * keyWidth, 0, i % 12);
			}
		}

		engine.endGroup();
	}
}
