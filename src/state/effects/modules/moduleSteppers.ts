import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import { State, Stepper, Module } from '../../types';

export default function moduleSteppers(state: State, events): void {
	function onModuleClick({ x, y, module }: { x: number; y: number; module: Module }) {
		const stepper = findModuleControllerAtViewportCoordinates<Stepper>(
			state.viewport,
			module,
			state.moduleTypes,
			'steppers',
			x,
			y
		);

		if (stepper) {
			if (stepper.y + module.y + state.viewport.y + 10 < y) {
				stepper.onChange(module, state, -1, stepper);
			} else {
				stepper.onChange(module, state, +1, stepper);
			}
		}
	}

	events.on('moduleClick', onModuleClick);
}
