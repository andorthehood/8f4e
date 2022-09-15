import { EventDispatcher } from '../../../events';
import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import { Module, Slider, State } from '../../types';

export default function moduleSliders(state: State, events: EventDispatcher): void {
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
		if (slider && slider.onChange) {
			event.stopPropagation = true;
			const { movementY } = event;
			slider.onChange(module, state.compiler.memoryBuffer, state.compiler.memoryAddressLookup, movementY, slider);
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
