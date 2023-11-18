import { EventDispatcher } from '../../../events';
import { CodeBlockGraphicData, State } from '../../types';

export default function nestedCodeBlocksOpener(state: State, events: EventDispatcher): () => void {
	const onOpenGroup = function ({ codeBlock }: { codeBlock: CodeBlockGraphicData }) {
		state.graphicHelper.activeViewport = codeBlock;
		events.dispatch('init');
	};

	const onGoBack = function () {
		state.graphicHelper.activeViewport = state.graphicHelper.activeViewport.parent;
	};

	events.on('openGroup', onOpenGroup);
	events.on('goBack', onGoBack);

	return () => {
		events.off('openGroup', onOpenGroup);
		events.off('goBack', onGoBack);
	};
}
