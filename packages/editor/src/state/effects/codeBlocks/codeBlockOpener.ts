import { EventDispatcher } from '../../../events';
import { State } from '../../types';

export default function codeBlockOpener(state: State, events: EventDispatcher): () => void {
	const onCodeBlockClick = function ({ x, y, codeBlock }) {
		const relativeX = Math.abs(codeBlock.x - (x - state.graphicHelper.viewport.x));
		const relativeY = Math.abs(codeBlock.y - (y - state.graphicHelper.viewport.y));
		if (relativeX <= 10 && relativeY <= 10) {
			codeBlock.isOpen = !codeBlock.isOpen;
		}
	};

	events.on('codeBlockClick', onCodeBlockClick);

	return () => {
		events.off('codeBlockClick', onCodeBlockClick);
	};
}
