import findButtonAtViewportCoordinates from './findButtonAtViewportCoordinates';

import type { State, Switch, CodeBlockGraphicData } from '~/types';
import type { DataStructure } from '@8f4e/compiler';

import { EventDispatcher } from '~/types';

export default function button(state: State, events: EventDispatcher): () => void {
	let lastPushedButton: Switch | undefined;
	let lastPushedButtonMemory: DataStructure | undefined;

	const onCodeBlockClick = function ({ x, y, codeBlock }: { x: number; y: number; codeBlock: CodeBlockGraphicData }) {
		lastPushedButton = findButtonAtViewportCoordinates(state, codeBlock, x, y);

		if (!lastPushedButton) {
			return;
		}

		if (!codeBlock.moduleId) {
			return;
		}

		lastPushedButtonMemory = state.compiler.compiledModules[codeBlock.moduleId]?.memoryMap[lastPushedButton.id];

		if (!lastPushedButtonMemory) {
			return;
		}

		state.callbacks?.setWordInMemory?.(
			lastPushedButtonMemory.wordAlignedAddress,
			lastPushedButton.onValue,
			lastPushedButtonMemory.isInteger ?? true
		);
	};

	const onMouseUp = function () {
		if (!lastPushedButtonMemory || !lastPushedButton) {
			return;
		}
		state.callbacks?.setWordInMemory?.(
			lastPushedButtonMemory.wordAlignedAddress,
			lastPushedButton.offValue,
			lastPushedButtonMemory.isInteger ?? true
		);
	};

	events.on('codeBlockClick', onCodeBlockClick);
	events.on('mouseup', onMouseUp);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
		events.off('mouseup', onMouseUp);
	};
}
