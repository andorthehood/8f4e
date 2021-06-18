import { modules, font, fillColor } from '../../../../packages/sprite-generator/src';
import scope from './scope';
import number from './number';
import midiNote from './midiNote';
import pianoQuantizer from './pianoQuantizer';
import drawConnectors from './connectors';
import drawSliders from './sliders';
import { State } from '../../../state/types';
import { Engine } from '2d-engine';
import drawSteppers from './steppers';

export default function drawModules(engine: Engine, state: State): void {
	const { vGrid, hGrid, x: offsetX, y: offsetY } = state.viewport;

	engine.startGroup(offsetX, offsetY);

	for (let i = 0; i < state.modules.length; i++) {
		const { x, y, type, id, config } = state.modules[i];
		const { width, height, name } = state.moduleTypes[type];

		if (
			x + offsetX > -1 * width &&
			y + offsetY > -1 * height &&
			x + offsetX < state.viewport.width &&
			y + offsetY < state.viewport.height
		) {
			engine.startGroup(x, y);
			engine.setSpriteLookup(fillColor);
			engine.drawSprite(0, 0, 'rgb(102,102,102)', width, 1);
			engine.drawSprite(0, 0, 'rgb(102,102,102)', 1, height);
			engine.drawSprite(0, height, 'rgb(102,102,102)', width, 1);
			engine.drawSprite(width, 0, 'rgb(102,102,102)', 1, height);

			if (type === 'scope') {
				scope(engine, state, id);
			}

			engine.setSpriteLookup(font('small_white'));
			engine.drawText(vGrid, 0, name);

			drawConnectors(engine, state.moduleTypes[type], state, id);
			drawSliders(engine, state.moduleTypes[type], state, id);
			drawSteppers(engine, state.moduleTypes[type], state, id);

			if (type === 'number') {
				number(engine, state, id);
			}

			if (type === 'midiNote') {
				midiNote(engine, state, id);
			}

			if (type === 'pianoQuantizer' || type == 'arpeggiator') {
				pianoQuantizer(engine, config);
			}

			// for (let i = 0; i < switches.length; i++) {
			// 	const _switch = switches[i];
			// 	engine.setSpriteLookup(fillColor);
			// 	if (config[_switch.id] === _switch.onValue) {
			// 		engine.drawRectangle(_switch.x, _switch.y, _switch.width, _switch.height, 'rgb(255,0,0)');
			// 	} else {
			// 		engine.drawRectangle(_switch.x, _switch.y, _switch.width, _switch.height, 'rgb(153,0,0)');
			// 	}
			// }

			engine.endGroup();
		}
	}

	engine.endGroup();
}
