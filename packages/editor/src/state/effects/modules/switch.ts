import { EventDispatcher } from '../../../events';
import findSwitchAtViewportCoordinates from '../../helpers/findSwitchAtViewportCoordinates';
import { State } from '../../types';

export default function moduleOpener(state: State, events: EventDispatcher): () => void {
	const onModuleClick = function ({ x, y, module }) {
		// const relativeX = Math.abs(module.x - (x - state.viewport.x));
		// const relativeY = Math.abs(module.y - (y - state.viewport.y));

		const _switch = findSwitchAtViewportCoordinates(state.project.viewport, state.graphicHelper, module, x, y);
		const graphicHelper = state.graphicHelper.modules.get(module);

		if (!_switch || !graphicHelper) {
			return;
		}

		const memory = state.compiler.compiledModules.get(graphicHelper.id)?.memoryMap.get(_switch.id);

		if (!memory) {
			return;
		}
		const value = state.compiler.memoryBuffer[memory.wordAddress];

		if (value === _switch.offValue) {
			state.compiler.memoryBuffer[memory.wordAddress] = _switch.onValue;
		} else if (value === _switch.onValue) {
			state.compiler.memoryBuffer[memory.wordAddress] = _switch.offValue;
		} else {
			state.compiler.memoryBuffer[memory.wordAddress] = _switch.offValue;
		}
	};

	events.on('moduleClick', onModuleClick);

	return () => {
		events.off('moduleClick', onModuleClick);
	};
}
