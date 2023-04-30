import { EventDispatcher } from '../../../events';
import findModuleAtViewportCoordinates from '../../helpers/findModuleAtViewportCoordinates';
import { State } from '../../types';

function getHighlightedMenuItem(x, y, itemHeight, width) {
	if (x < 0 || x > width || y < 0) {
		return Infinity;
	}
	return Math.floor(y / itemHeight);
}

export default function contextMenu(state: State, events: EventDispatcher): () => void {
	state.contextMenu = {
		highlightedItem: 0,
		itemHeight: 20,
		itemWidth: 200,
		items: [],
		open: false,
		x: 0,
		y: 0,
	};

	const onMouseMove = event => {
		const { itemHeight, itemWidth, x, y } = state.contextMenu;
		state.contextMenu.highlightedItem = getHighlightedMenuItem(event.x - x, event.y - y, itemHeight, itemWidth);
		event.stopPropagation = true;
	};

	const close = () => {
		events.off('mousedown', onMouseDown);
		events.off('mousemove', onMouseMove);
		state.contextMenu.open = false;
	};

	const onMouseDown = event => {
		const { highlightedItem, items } = state.contextMenu;

		if (items[highlightedItem]) {
			events.dispatch(items[highlightedItem].action, {
				...items[highlightedItem].payload,
				x: event.x,
				y: event.y,
			});

			if (items[highlightedItem].close) {
				close();
			}
		} else {
			close();
		}

		event.stopPropagation = true;
	};

	const onContextMenu = event => {
		const { x, y } = event;

		state.contextMenu.highlightedItem = 0;
		state.contextMenu.x = x;
		state.contextMenu.y = y;
		state.contextMenu.open = true;

		const module = findModuleAtViewportCoordinates(state.graphicHelper, state.project.viewport, x, y);

		if (module) {
			state.contextMenu.items = [
				// TODO module id mapper
				{ title: 'Delete module', action: 'deleteModule', payload: { module }, close: true },
				{ title: 'Remove wires', action: 'deleteConnection', payload: { module }, close: true },
				{ title: 'Copy module', action: 'copyModule', payload: { module }, close: true },
			];
		} else {
			state.contextMenu.items = [
				{
					title: 'New Module',
					action: 'addModule',
					payload: { isNew: true },
					close: true,
				},
				{
					title: 'New Group',
					action: 'addModule',
					payload: { isNew: true, isGroup: true },
					close: true,
				},
				{
					title: 'Paste Module',
					action: 'addModule',
					payload: { isPaste: true },
					close: true,
				},
				{
					title: 'Import RNBO patch',
					action: 'importRNBOPatch',
					close: true,
				},
				{
					title: 'Remove RNBO patches',
					action: 'removeRNBOPatches',
					close: true,
				},
				{ title: 'Undo', action: 'undo', close: true },
				{ title: 'Export', action: 'save', close: true },
				{ title: 'New', action: 'new', close: true },
				{ title: 'Open', action: 'open', close: true },
			];
		}

		events.on('mousedown', onMouseDown);
		events.on('mousemove', onMouseMove);
	};

	events.on('contextmenu', onContextMenu);

	return () => {
		events.off('contextmenu', onContextMenu);
	};
}
