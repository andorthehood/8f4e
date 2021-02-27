import findSwitchAtViewportCoordinates from '../../helpers/findSwitchAtViewportCoordinates';

const moduleSwitches = function (state, events) {
	const onModuleClick = function ({ x, y, module }) {
		const _switch = findSwitchAtViewportCoordinates(state, module, x, y);

		if (_switch) {
			module.config[_switch.id] = module.config[_switch.id] === _switch.onValue ? _switch.offValue : _switch.onValue;
			const address = state.ui.compiler.outputAddressLookup[module.id + _switch.id] / Uint32Array.BYTES_PER_ELEMENT;
			state.ui.compiler.memoryBuffer[address] = module.config[_switch.id];
		}
	};

	events.on('moduleClick', onModuleClick);
};

export default moduleSwitches;
