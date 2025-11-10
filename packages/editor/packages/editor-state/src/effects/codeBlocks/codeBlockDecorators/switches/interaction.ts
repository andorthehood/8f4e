import { EventDispatcher } from '../../../../types';
import findSwitchAtViewportCoordinates from '../../../../helpers/findSwitchAtViewportCoordinates';

import type { State, CodeBlockGraphicData } from '../../../../types';

export default function _switch(state: State, events: EventDispatcher): () => void {
	const onCodeBlockClick = function ({ x, y, codeBlock }: { x: number; y: number; codeBlock: CodeBlockGraphicData }) {
		const _switch = findSwitchAtViewportCoordinates(state.graphicHelper, codeBlock, x, y);

		if (!_switch) {
			return;
		}

		const memory = state.compiler.compiledModules[codeBlock.id]?.memoryMap[_switch.id];

		if (!memory) {
			return;
		}
		const value = state.compiler.memoryBuffer[memory.wordAlignedAddress];

		if (value === _switch.offValue) {
			state.compiler.memoryBuffer[memory.wordAlignedAddress] = _switch.onValue;
		} else if (value === _switch.onValue) {
			state.compiler.memoryBuffer[memory.wordAlignedAddress] = _switch.offValue;
		} else {
			state.compiler.memoryBuffer[memory.wordAlignedAddress] = _switch.offValue;
		}
	};

	events.on('codeBlockClick', onCodeBlockClick);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
	};
}
