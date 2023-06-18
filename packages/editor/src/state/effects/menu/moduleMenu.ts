import { EventDispatcher } from '../../../events';
import { State } from '../../types';

export default function contextMenu(state: State, events: EventDispatcher): () => void {
	const onModuleMenu = event => {
		const { y } = event;

		state.graphicHelper.contextMenu.highlightedItem = 0;
		state.graphicHelper.contextMenu.y = y;
		state.graphicHelper.contextMenu.open = true;

		if (event.category) {
			state.graphicHelper.contextMenu.items = [
				{
					title: 'Back',
					action: 'openModuleMenu',
					payload: {},
					close: false,
				},
			];
		} else {
			state.graphicHelper.contextMenu.items = [
				{
					title: 'Back',
					action: 'contextmenu',
					payload: {},
					close: false,
				},
			];
		}
	};

	events.on('openModuleMenu', onModuleMenu);

	return () => {
		events.off('openModuleMenu', onModuleMenu);
	};
}
