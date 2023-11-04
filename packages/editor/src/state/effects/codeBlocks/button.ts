import { MemoryItem } from '@8f4e/compiler';

import { EventDispatcher } from '../../../events';
import findButtonAtViewportCoordinates from '../../helpers/findButtonAtViewportCoordinates';
import { State, Switch } from '../../types';

export default function button(state: State, events: EventDispatcher): () => void {
	let lastPushedButton: Switch | undefined;
	let lastPushedButtonMemory: MemoryItem | undefined;

	const onCodeBlockClick = function ({ x, y, codeBlock }) {
		lastPushedButton = findButtonAtViewportCoordinates(state.graphicHelper, codeBlock, x, y);

		if (!lastPushedButton) {
			return;
		}

		lastPushedButtonMemory = state.compiler.compiledModules.get(codeBlock.id)?.memoryMap.get(lastPushedButton.id);

		if (!lastPushedButtonMemory) {
			return;
		}

		state.compiler.memoryBuffer[lastPushedButtonMemory.wordAddress] = lastPushedButton.onValue;
	};

	const onMouseUp = function () {
		if (!lastPushedButtonMemory || !lastPushedButton) {
			return;
		}
		state.compiler.memoryBuffer[lastPushedButtonMemory.wordAddress] = lastPushedButton.offValue;
	};

	events.on('codeBlockClick', onCodeBlockClick);
	events.on('mouseup', onMouseUp);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
		events.off('mouseup', onMouseUp);
	};
}
