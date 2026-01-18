import findSwitchAtViewportCoordinates from './findSwitchAtViewportCoordinates';

import type { State, CodeBlockGraphicData } from '~/types';

import { EventDispatcher } from '~/types';

export default function _switch(state: State, events: EventDispatcher): () => void {
	const onCodeBlockClick = function ({ x, y, codeBlock }: { x: number; y: number; codeBlock: CodeBlockGraphicData }) {
		const _switch = findSwitchAtViewportCoordinates(state, codeBlock, x, y);

		if (!_switch) {
			return;
		}

		const memory = state.compiler.compiledModules[codeBlock.id]?.memoryMap[_switch.id];

		if (!memory) {
			return;
		}
		const value = state.callbacks?.getWordFromMemory?.(memory.wordAlignedAddress);

		if (value === _switch.offValue) {
			state.callbacks?.setWordInMemory?.(memory.wordAlignedAddress, _switch.onValue);
		} else if (value === _switch.onValue) {
			state.callbacks?.setWordInMemory?.(memory.wordAlignedAddress, _switch.offValue);
		} else {
			state.callbacks?.setWordInMemory?.(memory.wordAlignedAddress, _switch.offValue);
		}
	};

	events.on('codeBlockClick', onCodeBlockClick);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
	};
}
