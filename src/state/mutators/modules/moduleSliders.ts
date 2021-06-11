import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import { State } from '../../types';

export default function moduleSliders(state: State, events): void {
	let slider = null;
	let module = null;

	function onModuleClick(event) {
		const { x, y } = event;
		event.stopPropagation = true;

		module = event.module;
		slider = findModuleControllerAtViewportCoordinates(state.viewport, module, 'sliders', x, y);
	}

	function onMouseMove(event) {
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
	}

	function onMouseUp() {
		slider = null;
		module = null;
	}

	events.on('moduleClick', onModuleClick);
	events.on('mouseup', onMouseUp);
	events.on('mousemove', onMouseMove);
}
