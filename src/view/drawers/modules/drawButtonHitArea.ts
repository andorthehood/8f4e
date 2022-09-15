import { fillColor } from '@8f4e/sprite-generator';
import { Engine } from '@8f4e/2d-engine';

import { ModuleType } from '../../../state/types';

export default function drawButtonHitArea(engine: Engine, buttons: ModuleType['buttons']): void {
	for (let i = 0; i < buttons.length; i++) {
		const button = buttons[i];
		engine.setSpriteLookup(fillColor);
		engine.drawRectangle(button.x, button.y, button.width, button.height, 'rgb(255,0,0)');
	}
}
