import { Engine } from '@8f4e/2d-engine';
import { PianoKey } from '@8f4e/sprite-generator';

import { ModuleGraphicData, State } from '../../../state/types';

export default function drawer(engine: Engine, state: State, module: ModuleGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.pianoKeys);

	for (const [, { x, y, width, height }] of module.pianoKeyboards) {
		engine.startGroup(x, y);

		engine.drawSprite(0, 0, PianoKey.NORMAL);
		engine.drawSprite(192, 0, PianoKey.NORMAL);
		engine.endGroup();
	}
}
