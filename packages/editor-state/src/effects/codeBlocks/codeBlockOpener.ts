import { CodeBlockClickEvent } from './codeBlockDragger';

import { EventDispatcher } from '../../types';

import type { State, CodeBlockGraphicData } from '../../types';

export default function codeBlockOpener(state: State, events: EventDispatcher): () => void {
	const onCodeBlockClick = function ({ x, y, codeBlock }: { x: number; y: number; codeBlock: CodeBlockGraphicData }) {
		const relativeX = Math.abs(codeBlock.x - (x - state.graphicHelper.activeViewport.viewport.x));
		const relativeY = Math.abs(codeBlock.y - (y - state.graphicHelper.activeViewport.viewport.y));
		if (relativeX <= 10 && relativeY <= 10) {
			codeBlock.isOpen = !codeBlock.isOpen;
		}
	};

	events.on<CodeBlockClickEvent>('codeBlockClick', onCodeBlockClick);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
	};
}
