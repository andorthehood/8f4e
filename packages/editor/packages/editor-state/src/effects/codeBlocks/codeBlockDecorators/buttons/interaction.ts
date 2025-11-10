import { EventDispatcher } from '../../../../types';
import findButtonAtViewportCoordinates from '../../../../helpers/findButtonAtViewportCoordinates';

import type { State, Switch, CodeBlockGraphicData } from '../../../../types';
import type { DataStructure } from '@8f4e/compiler';

export default function button(state: State, events: EventDispatcher): () => void {
	let lastPushedButton: Switch | undefined;
	let lastPushedButtonMemory: DataStructure | undefined;

	const onCodeBlockClick = function ({ x, y, codeBlock }: { x: number; y: number; codeBlock: CodeBlockGraphicData }) {
		lastPushedButton = findButtonAtViewportCoordinates(state.graphicHelper, codeBlock, x, y);

		if (!lastPushedButton) {
			return;
		}

		lastPushedButtonMemory = state.compiler.compiledModules[codeBlock.id]?.memoryMap[lastPushedButton.id];

		if (!lastPushedButtonMemory) {
			return;
		}

		state.compiler.memoryBuffer[lastPushedButtonMemory.wordAlignedAddress] = lastPushedButton.onValue;
	};

	const onMouseUp = function () {
		if (!lastPushedButtonMemory || !lastPushedButton) {
			return;
		}
		state.compiler.memoryBuffer[lastPushedButtonMemory.wordAlignedAddress] = lastPushedButton.offValue;
	};

	events.on('codeBlockClick', onCodeBlockClick);
	events.on('mouseup', onMouseUp);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
		events.off('mouseup', onMouseUp);
	};
}
