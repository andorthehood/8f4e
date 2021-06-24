import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import { State, Stepper, Module } from '../../types';

export default function moduleSwitches(state: State, events): void {
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
			let newValue = module.state[stepper.id];

			if (stepper.y + module.y + state.viewport.y + 10 < y) {
				newValue--;
			} else {
				newValue++;
			}

			module.state[stepper.id] = Math.min(Math.max(newValue, stepper.minValue), stepper.maxValue);

			const address =
				state.compiler.memoryAddressLookup[module.id + '_' + stepper.id] /
				state.compiler.memoryBuffer.BYTES_PER_ELEMENT;
			state.compiler.memoryBuffer[address] = module.state[stepper.id];
		}
	}

	events.on('moduleClick', onModuleClick);
}
