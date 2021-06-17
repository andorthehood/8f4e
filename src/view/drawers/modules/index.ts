import { modules, font, fillColor } from '../../../../packages/sprite-generator/src';
import scope from './scope';
import number from './number';
import midiNote from './midiNote';
import pianoQuantizer from './pianoQuantizer';
import drawConnectors from './connectors';
import { State } from '../../../state/types';
import { Engine } from '2d-engine';

export default function drawModules(engine: Engine, state: State): void {
	const { vGrid, hGrid, x: offsetX, y: offsetY } = state.viewport;

	engine.startGroup(offsetX, offsetY);

	for (let i = 0; i < state.modules.length; i++) {
		const { x, y, type, id, config, row, col } = state.modules[i];
		const { width, height, name, switches, sliders, steppers } = state.moduleTypes[type];

		if (
			x + offsetX > -1 * width &&
			y + offsetY > -1 * height &&
			x + offsetX < state.viewport.width &&
			y + offsetY < state.viewport.height
		) {
			engine.startGroup(col * vGrid, row * hGrid);
			engine.setSpriteLookup(modules);
			engine.drawSprite(0, 0, type, width, height);

			if (type === 'scope') {
				scope(engine, state, id);
			}

			engine.setSpriteLookup(font('small_white'));
			engine.drawText(5, 5, name);

			drawConnectors(engine, state.moduleTypes[type], state, id);

			for (let i = 0; i < sliders.length; i++) {
				const slider = sliders[i];
				engine.setSpriteLookup(fillColor);
				engine.drawRectangle(slider.x, slider.y, slider.width, slider.height, 'rgb(255,255,255)');

				const address =
					state.compiler.outputAddressLookup[id + '_' + slider.id] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT;
				const value = state.compiler.memoryBuffer[address];
				const offset = (value / slider.maxValue) * slider.height;
				engine.drawSprite(slider.x, slider.y + (slider.height - offset), 'rgb(255,255,255)', slider.width, offset);
				engine.setSpriteLookup(font('small_white'));
				engine.drawText(slider.x, slider.y, '' + value / slider.resolution);
			}

			for (let i = 0; i < steppers.length; i++) {
				const stepper = steppers[i];
				engine.setSpriteLookup(fillColor);
				engine.drawRectangle(stepper.x, stepper.y, stepper.width, stepper.height / 2, 'rgb(255,255,255)');
				engine.drawRectangle(
					stepper.x,
					stepper.y + stepper.height / 2,
					stepper.width,
					stepper.height / 2,
					'rgb(255,255,255)'
				);

				const address =
					state.compiler.outputAddressLookup[id + '_' + stepper.id] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT;
				const value = state.compiler.memoryBuffer[address];

				engine.setSpriteLookup(font('small_white'));
				engine.drawText(stepper.x + 12, stepper.y, '' + value);
			}

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
