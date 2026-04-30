import findSwitchWidgetAtViewportCoordinates from './findWidgetAtViewportCoordinates';

import type { State, CodeBlockGraphicData } from '@8f4e/editor-state-types';
import type { EventDispatcher } from '@8f4e/editor-state-types';

export default function _switch(state: State, events: EventDispatcher): () => void {
	const onCodeBlockClick = function ({ x, y, codeBlock }: { x: number; y: number; codeBlock: CodeBlockGraphicData }) {
		const _switch = findSwitchWidgetAtViewportCoordinates(state, codeBlock, x, y);

		if (!_switch) {
			return;
		}

		const value = state.callbacks?.getWordFromMemory?.(_switch.wordAlignedAddress);

		if (value === _switch.offValue) {
			state.callbacks?.setWordInMemory?.(_switch.wordAlignedAddress, _switch.onValue, _switch.isInteger);
		} else if (value === _switch.onValue) {
			state.callbacks?.setWordInMemory?.(_switch.wordAlignedAddress, _switch.offValue, _switch.isInteger);
		} else {
			state.callbacks?.setWordInMemory?.(_switch.wordAlignedAddress, _switch.offValue, _switch.isInteger);
		}
	};

	events.on('codeBlockClick', onCodeBlockClick);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
	};
}
