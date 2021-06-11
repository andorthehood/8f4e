import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import * as moduleTypes from '../../../modules';
import { State } from '../../types';

export default function moduleSwitches(state: State, events): void {
	const onModuleClick = function ({ x, y, module }) {
		const _switch = findModuleControllerAtViewportCoordinates(state.viewport, module, 'switches', x, y);

		if (_switch) {
			module.config[_switch.id] = module.config[_switch.id] === _switch.onValue ? _switch.offValue : _switch.onValue;

			moduleTypes[module.type].transformer(module, state.compiler.memoryBuffer, state.compiler.outputAddressLookup);
		}
	};

	events.on('moduleClick', onModuleClick);
}
