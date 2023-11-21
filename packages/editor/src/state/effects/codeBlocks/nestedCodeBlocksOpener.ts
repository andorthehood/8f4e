import { EventDispatcher } from '../../../events';
import { State } from '../../types';
import { OpenGroupEvent } from '../menu/menus';

export default function nestedCodeBlocksOpener(state: State, events: EventDispatcher): () => void {
	const onOpenGroup = function ({ codeBlock }: OpenGroupEvent) {
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
