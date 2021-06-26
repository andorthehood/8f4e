import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import { State, Button, Module } from '../../types';

export default function moduleButtons(state: State, events): void {
	const onModuleClick = function ({ x, y, module }: { x: number; y: number; module: Module }) {
		const _switch = findModuleControllerAtViewportCoordinates<Button>(
			state.viewport,
			module,
			state.moduleTypes,
			'buttons',
			x,
			y
		);

		if (_switch) {
			_switch.onClick(module, state.compiler.memoryBuffer, state.compiler.memoryAddressLookup, _switch.value);
		}
	};

	events.on('moduleClick', onModuleClick);
}
