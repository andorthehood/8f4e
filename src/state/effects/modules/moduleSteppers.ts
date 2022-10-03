import { EventDispatcher } from '../../../events';
import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import { Module, State } from '../../types';

export default function moduleSteppers(state: State, events: EventDispatcher): void {
	function onModuleClick({ x, y, module }: { x: number; y: number; module: Module }) {
		const stepper = findModuleControllerAtViewportCoordinates(
			state.viewport,
			module,
			state.moduleTypes,
			'steppers',
			x,
			y
		);

		if (stepper) {
			if (
				stepper.y + stepper.downHitArea.y + module.y + state.viewport.y <= y &&
				stepper.y + stepper.downHitArea.y + stepper.downHitArea.height + module.y + state.viewport.y >= y &&
				stepper.x + stepper.downHitArea.x + module.x + state.viewport.x <= x &&
				stepper.x + stepper.downHitArea.x + stepper.downHitArea.width + module.x + state.viewport.x >= x
			) {
				stepper.onChange(module, state, -1, stepper);
			}

			if (
				stepper.y + stepper.upHitArea.y + module.y + state.viewport.y <= y &&
				stepper.y + stepper.upHitArea.y + stepper.upHitArea.height + module.y + state.viewport.y >= y &&
				stepper.x + stepper.upHitArea.x + module.x + state.viewport.x <= x &&
				stepper.x + stepper.upHitArea.x + stepper.upHitArea.width + module.x + state.viewport.x >= x
			) {
				stepper.onChange(module, state, +1, stepper);
			}
		}
	}

	events.on('moduleClick', onModuleClick);
}
