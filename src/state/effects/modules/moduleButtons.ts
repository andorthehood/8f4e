import { EventDispatcher } from '../../../events';
import findModuleControllerAtViewportCoordinates from '../../helpers/findModuleControllerAtViewportCoordinates';
import { Button, Module, State } from '../../types';

export default function moduleButtons(state: State, events: EventDispatcher): void {
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
