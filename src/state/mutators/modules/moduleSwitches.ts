import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import * as moduleTypes from '../../../modules';

const moduleSwitches = function (state, events) {
	const onModuleClick = function ({ x, y, module }) {
		const _switch = findModuleControllerAtViewportCoordinates(state.ui, module, 'switches', x, y);

		if (_switch) {
			module.config[_switch.id] = module.config[_switch.id] === _switch.onValue ? _switch.offValue : _switch.onValue;

			moduleTypes[module.type].transformer(
				module,
				state.ui.compiler.memoryBuffer,
				state.ui.compiler.outputAddressLookup
			);
		}
	};

	events.on('moduleClick', onModuleClick);
};

export default moduleSwitches;
