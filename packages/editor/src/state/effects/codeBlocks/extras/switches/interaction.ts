import { EventDispatcher } from '../../../../../events';
import findSwitchAtViewportCoordinates from '../../../../helpers/findSwitchAtViewportCoordinates';
import { State } from '../../../../types';

export default function _switch(state: State, events: EventDispatcher): () => void {
	const onCodeBlockClick = function ({ x, y, codeBlock }) {
		const _switch = findSwitchAtViewportCoordinates(state.graphicHelper, codeBlock, x, y);

		if (!_switch) {
			return;
		}

		const memory = state.compiler.compiledModules.get(codeBlock.id)?.memoryMap.get(_switch.id);

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

	events.on('codeBlockClick', onCodeBlockClick);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
	};
}
