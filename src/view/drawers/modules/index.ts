import { Engine } from '@8f4e/2d-engine';
import { fillColor, font, Icon } from '@8f4e/sprite-generator';

import scope from './scope';
import number from './number';
import midiNote from './midiNote';
import pianoQuantizer from './pianoQuantizer';
import drawConnectors from './connectors';
import drawSliders from './sliders';
import drawSteppers from './steppers';
import drawLines from './lines';
import drawButtonHitArea from './drawButtonHitArea';

import { State } from '../../../state/types';
import { HGRID, VGRID } from '../consts';

export default function drawModules(engine: Engine, state: State): void {
	const { x: offsetX, y: offsetY } = state.viewport;

	engine.startGroup(offsetX, offsetY);

	for (let i = 0; i < state.modules.length; i++) {
		const { x, y, type, id } = state.modules[i];
		const { width, height, name, sliders, steppers, lines, drawer, buttons } = state.moduleTypes[type];

		if (
			x + offsetX > -1 * width &&
			y + offsetY > -1 * height &&
			x + offsetX < state.viewport.width &&
			y + offsetY < state.viewport.height &&
			!state.compiler.isCompiling
		) {
			engine.startGroup(x, y);

			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'rgb(0,0,0)', width, height);

			engine.setSpriteLookup(font('icons_white'));
			engine.drawText(0, 0, String.fromCharCode(Icon.CORNER_TOP_LEFT));
			engine.drawText(width - VGRID, 0, String.fromCharCode(Icon.CORNER_TOP_RIGHT));
			engine.drawText(0, height - HGRID, String.fromCharCode(Icon.CORNER_BOTTOM_LEFT));
			engine.drawText(width - VGRID, height - HGRID, String.fromCharCode(Icon.CORNER_BOTTOM_RIGHT));

			//drawLines(engine, lines);

			if (type === 'scope') {
				scope(engine, state, id);
			}

			engine.setSpriteLookup(font('white'));
			engine.drawText(VGRID * 2, 0, name);

			drawConnectors(engine, state.moduleTypes[type], state, id);
			drawSliders(engine, sliders, state, id);
			drawSteppers(engine, steppers, state, id);

			if (type === 'number') {
				number(engine, state, id);
			}

			if (type === 'midiNote') {
				midiNote(engine, state, id);
			}

			if (drawer && drawer.name === 'piano') {
				pianoQuantizer(
					engine,
					state.modules[i],
					state.moduleTypes[type],
					state.compiler.memoryAddressLookup,
					state.compiler.memoryBuffer
				);
			}

			if (state.isDebugMode) {
				drawButtonHitArea(engine, buttons);
			}

			engine.endGroup();
		}
	}

	engine.endGroup();
}
