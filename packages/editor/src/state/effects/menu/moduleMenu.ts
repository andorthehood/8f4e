import { EventDispatcher } from '../../../events';
import { State } from '../../types';

export default function contextMenu(state: State, events: EventDispatcher): () => void {
	const onModuleMenu = event => {
		const { y } = event;

		state.contextMenu.highlightedItem = 0;
		state.contextMenu.y = y;
		state.contextMenu.open = true;

		if (event.category) {
			state.contextMenu.items = [
				{
					title: 'Back',
					action: 'openModuleMenu',
					payload: {},
					close: false,
				},
			];
		} else {
			state.contextMenu.items = [
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
