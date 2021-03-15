import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';

const moduleSwitches = function (state, events) {
	const onModuleClick = function ({ x, y, module }) {
		const _switch = findModuleControllerAtViewportCoordinates(state.ui, module, 'switches', x, y);

		if (_switch) {
			module.config[_switch.id] = module.config[_switch.id] === _switch.onValue ? _switch.offValue : _switch.onValue;
			const address =
				state.ui.compiler.outputAddressLookup[module.id + '_' + _switch.id] / Uint32Array.BYTES_PER_ELEMENT;
			state.ui.compiler.memoryBuffer[address] = module.config[_switch.id];
		}
	};

	events.on('moduleClick', onModuleClick);
};

export default moduleSwitches;
