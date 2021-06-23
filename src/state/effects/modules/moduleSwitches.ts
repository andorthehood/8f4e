import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import { State, Switch, Module } from '../../types';

export default function moduleSwitches(state: State, events): void {
	const onModuleClick = function ({ x, y, module }: { x: number; y: number; module: Module }) {
		const _switch = findModuleControllerAtViewportCoordinates<Switch>(
			state.viewport,
			module,
			state.moduleTypes,
			'switches',
			x,
			y
		);

		if (_switch) {
			module.state[_switch.id] = module.state[_switch.id] === _switch.onValue ? _switch.offValue : _switch.onValue;

			state.moduleTypes[module.type].transformer(
				module,
				state.compiler.memoryBuffer,
				state.compiler.outputAddressLookup
			);
		}
	};

	events.on('moduleClick', onModuleClick);
}
