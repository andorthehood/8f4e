import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import { State, Switch, Module } from '../../types';

export default function moduleButtons(state: State, events): void {
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
			_switch.onClick(module, state.compiler.memoryBuffer, state.compiler.memoryAddressLookup, _switch.value);
		}
	};

	events.on('moduleClick', onModuleClick);
}
