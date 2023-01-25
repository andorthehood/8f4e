import { Engine } from '@8f4e/2d-engine';
import { fillColor, font, Mosaic } from '@8f4e/sprite-generator';

import scope from './scope';
import pianoQuantizer from './pianoQuantizer';
import drawConnectors from './connectors';
import drawButtonHitArea from './drawButtonHitArea';

import { State } from '../../../state/types';
import { HGRID, VGRID } from '../consts';

export default function drawModules(engine: Engine, state: State): void {
	const { x: offsetX, y: offsetY } = state.viewport;

	engine.startGroup(offsetX, offsetY);

	for (let i = 0; i < state.modules.length; i++) {
		const { x, y, type, id } = state.modules[i];
		const { drawer, buttons } = state.moduleTypes[type];
		const { width, height, code, codeColors } = state.graphicHelper.get(state.modules[i].id) || {
			width: 0,
			height: 0,
			code: [],
			codeColors: [],
		};

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

			engine.setSpriteLookup(font('white'));
			engine.drawText(0, 0, '+');
			engine.drawText(width - VGRID, 0, '+');
			engine.drawText(0, height - HGRID, '+');
			engine.drawText(width - VGRID, height - HGRID, '+');

			if (type === 'scope') {
				scope(engine, state, id);
			}

			engine.setSpriteLookup(font('white'));

			drawConnectors(engine, state, id, code);

			// if (sliders) {
			// 	drawSliders(engine, sliders, state, id);
			// }

			// if (steppers) {
			// 	drawSteppers(engine, steppers, state, id);
			// }

			// if (type === 'number') {
			// 	number(engine, state, id);
			// }

			// if (type === 'midiNote') {
			// 	midiNote(engine, state, id);
			// }

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

			engine.setSpriteLookup(font('white'));
			for (let i = 0; i < code.length; i++) {
				engine.drawText(VGRID, HGRID * i, code[i], codeColors[i]);
			}

			engine.endGroup();
		}
	}

	engine.endGroup();
}
