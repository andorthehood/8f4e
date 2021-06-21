import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import { State, Module, Slider } from '../../types';

export default function moduleSliders(state: State, events): void {
	let slider: Slider = null;
	let module: Module = null;

	function onModuleClick(event: { x: number; y: number; module: Module; stopPropagation: boolean }) {
		const { x, y } = event;
		event.stopPropagation = true;

		module = event.module;
		slider = findModuleControllerAtViewportCoordinates<Slider>(
			state.viewport,
			module,
			state.moduleTypes,
			'sliders',
			x,
			y
		);
	}

	function onMouseMove(event) {
		if (slider) {
			event.stopPropagation = true;
			const { movementY } = event;

			module.state[slider.id] = Math.min(
				Math.max(slider.minValue, module.state[slider.id] + movementY * -1 * slider.resolution),
				slider.maxValue
			);

			const address =
				state.compiler.outputAddressLookup[module.id + '_' + slider.id] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT;
			state.compiler.memoryBuffer[address] = module.state[slider.id];
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
