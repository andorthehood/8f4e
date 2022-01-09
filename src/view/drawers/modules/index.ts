import { font, fillColor } from 'sprite-generator';
import scope from './scope';
import number from './number';
import midiNote from './midiNote';
import pianoQuantizer from './pianoQuantizer2';
import drawConnectors from './connectors';
import drawSliders from './sliders';
import { State } from '../../../state/types';
import { Engine } from '2d-engine';
import drawSteppers from './steppers';
import drawLines from './lines';

export default function drawModules(engine: Engine, state: State): void {
	const { vGrid, hGrid, x: offsetX, y: offsetY } = state.viewport;

	engine.startGroup(offsetX, offsetY);

	for (let i = 0; i < state.modules.length; i++) {
		const { x, y, type, id } = state.modules[i];
		const { width, height, name, sliders, steppers, lines, drawer } = state.moduleTypes[type];

		if (
			x + offsetX > -1 * width &&
			y + offsetY > -1 * height &&
			x + offsetX < state.viewport.width &&
			y + offsetY < state.viewport.height &&
			!state.compiler.isCompiling
		) {
			engine.startGroup(x, y);
			engine.setSpriteLookup(fillColor);

			drawLines(engine, lines);

			if (type === 'scope') {
				scope(engine, state, id);
			}

			engine.setSpriteLookup(font('small_white'));
			engine.drawText(vGrid * 2, hGrid, name);

			drawConnectors(engine, state.moduleTypes[type], state, id);
			drawSliders(engine, sliders, state, id);
			drawSteppers(engine, steppers, state, id, vGrid, hGrid);

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

			engine.endGroup();
		}
	}

	engine.endGroup();
}
