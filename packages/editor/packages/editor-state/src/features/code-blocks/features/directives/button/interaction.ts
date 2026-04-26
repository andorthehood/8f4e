import findButtonWidgetAtViewportCoordinates from './findWidgetAtViewportCoordinates';

import type { State, Switch, CodeBlockGraphicData } from '~/types';

import { EventDispatcher } from '~/types';

export default function button(state: State, events: EventDispatcher): () => void {
	let lastPushedButton: Switch | undefined;

	const onCodeBlockClick = function ({ x, y, codeBlock }: { x: number; y: number; codeBlock: CodeBlockGraphicData }) {
		lastPushedButton = findButtonWidgetAtViewportCoordinates(state, codeBlock, x, y);

		if (!lastPushedButton) {
			return;
		}

		state.callbacks?.setWordInMemory?.(
			lastPushedButton.wordAlignedAddress,
			lastPushedButton.onValue,
			lastPushedButton.isInteger
		);
	};

	const onMouseUp = function () {
		if (!lastPushedButton) {
			return;
		}
		state.callbacks?.setWordInMemory?.(
			lastPushedButton.wordAlignedAddress,
			lastPushedButton.offValue,
			lastPushedButton.isInteger
		);
	};

	events.on('codeBlockClick', onCodeBlockClick);
	events.on('mouseup', onMouseUp);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
		events.off('mouseup', onMouseUp);
	};
}
