import { modules, feedbackScale, font, fillColor } from '../../spriteGenerator';
import scope from './scope';

const drawModules = function (engine, state) {
	const offsetX = state.ui.viewport.x;
	const offsetY = state.ui.viewport.y;

	engine.startGroup(offsetX, offsetY);

	for (let i = 0; i < state.ui.modules.length; i++) {
		const { x, y, type, id, config } = state.ui.modules[i];
		const { width, height, name, connectors, switches, sliders } = state.ui.moduleTypes[type];

		if (
			x + offsetX > -1 * width &&
			y + offsetY > -1 * height &&
			x + offsetX < state.ui.viewport.width &&
			y + offsetY < state.ui.viewport.height
		) {
			engine.startGroup(x, y);
			engine.setSpriteLookup(modules);
			engine.drawSprite(0, 0, type, width, height);
			engine.setSpriteLookup(font('small_white'));
			engine.drawText(5, 5, name);

			for (let i = 0; i < connectors.length; i++) {
				const connector = connectors[i];

				if (typeof state.ui.compiler.outputAddressLookup[id + connector.id] !== 'undefined') {
					const connectorAddress = state.ui.compiler.outputAddressLookup[id + connector.id];
					const value = state.ui.compiler.memoryBuffer[connectorAddress / 4];

					if (connector.isInput) {
						engine.setSpriteLookup(fillColor);
						engine.drawRectangle(connector.x, connector.y, 10, 10, 'rgb(153,153,153)');
					} else {
						engine.setSpriteLookup(feedbackScale);
						engine.drawSprite(connector.x, connector.y, value, 10, 10);
					}
					engine.setSpriteLookup(font('small_white'));
					const offset = connector.isInput ? 15 : (connector.label || connector.id).length * -7;
					engine.drawText(connector.x + offset, connector.y, connector.label || connector.id);
				}
			}

			for (let i = 0; i < switches.length; i++) {
				const _switch = switches[i];
				engine.setSpriteLookup(fillColor);
				if (config[_switch.id] === _switch.onValue) {
					engine.drawRectangle(_switch.x, _switch.y, _switch.width, _switch.height, 'rgb(255,255,255)');
				} else {
					engine.drawRectangle(_switch.x, _switch.y, _switch.width, _switch.height, 'rgb(153,153,153)');
				}
			}

			for (let i = 0; i < sliders.length; i++) {
				const slider = sliders[i];
				engine.setSpriteLookup(fillColor);
				engine.drawRectangle(slider.x, slider.y, slider.width, slider.height, 'rgb(255,255,255)');

				const address = state.ui.compiler.outputAddressLookup[id + slider.id] / Uint32Array.BYTES_PER_ELEMENT;
				const value = state.ui.compiler.memoryBuffer[address];
				const offset = (value / slider.maxValue) * slider.height;
				engine.drawSprite(slider.x, slider.y + (slider.height - offset), 'rgb(255,255,255)', slider.width, offset);
				engine.setSpriteLookup(font('small_white'));
				engine.drawText(slider.x, slider.y, '' + value);
			}

			if (type === 'scope') {
				scope(engine, state, id);
			}

			engine.endGroup();
		}
	}

	engine.endGroup();
};

export default drawModules;
