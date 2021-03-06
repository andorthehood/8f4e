import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';

const moduleSwitches = function (state, events) {
	const onModuleClick = function ({ x, y, module }) {
		const stepper = findModuleControllerAtViewportCoordinates(state.ui, module, 'steppers', x, y);

		if (stepper) {
			let newValue = module.config[stepper.id];

			if (stepper.y + module.y + state.ui.viewport.y + 10 < y) {
				newValue--;
			} else {
				newValue++;
			}

			module.config[stepper.id] = Math.min(Math.max(newValue, stepper.minValue), stepper.maxValue);

			const address = state.ui.compiler.outputAddressLookup[module.id + stepper.id] / Uint32Array.BYTES_PER_ELEMENT;
			state.ui.compiler.memoryBuffer[address] = module.config[stepper.id];
		}
	};

	events.on('moduleClick', onModuleClick);
};

export default moduleSwitches;
