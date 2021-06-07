import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import { State } from '../../types';

export default function moduleSliders(state: State, events) {
	let slider = null;
	let module = null;

	const onModuleClick = function (event) {
		const { x, y } = event;
		event.stopPropagation = true;

		module = event.module;
		slider = findModuleControllerAtViewportCoordinates(state.viewport, module, 'sliders', x, y);
	};

	const onMouseMove = function (event) {
		if (slider) {
			event.stopPropagation = true;
			const { movementY } = event;

			module.config[slider.id] = Math.min(
				Math.max(slider.minValue, module.config[slider.id] + movementY * -1 * slider.resolution),
				slider.maxValue
			);

			const address =
				state.compiler.outputAddressLookup[module.id + '_' + slider.id] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT;
			state.compiler.memoryBuffer[address] = module.config[slider.id];
		}
	};

	const onMouseUp = function () {
		slider = null;
		module = null;
	};

	events.on('moduleClick', onModuleClick);
	events.on('mouseup', onMouseUp);
	events.on('mousemove', onMouseMove);
}
