import * as menus from './menus';

import { EventDispatcher } from '../../../events';
import { HGRID, VGRID } from '../../../view/drawers/consts';
import findModuleAtViewportCoordinates from '../../helpers/findModuleAtViewportCoordinates';
import { State } from '../../types';

function getHighlightedMenuItem(x, y, width) {
	if (x < 0 || x > width || y < 0) {
		return Infinity;
	}
	return Math.floor(y / HGRID);
}

export default function contextMenu(state: State, events: EventDispatcher): () => void {
	const onMouseMove = event => {
		const { itemWidth, x, y } = state.graphicHelper.contextMenu;
		state.graphicHelper.contextMenu.highlightedItem = getHighlightedMenuItem(event.x - x, event.y - y, itemWidth);
		event.stopPropagation = true;
	};

	const close = () => {
		events.off('mousedown', onMouseDown);
		events.off('mousemove', onMouseMove);
		state.graphicHelper.contextMenu.open = false;
	};

	const onMouseDown = event => {
		const { highlightedItem, items } = state.graphicHelper.contextMenu;

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

		state.graphicHelper.contextMenu.highlightedItem = 0;
		state.graphicHelper.contextMenu.x = Math.round(x / VGRID) * VGRID;
		state.graphicHelper.contextMenu.y = Math.round(y / HGRID) * HGRID;
		state.graphicHelper.contextMenu.open = true;

		const module = findModuleAtViewportCoordinates(state.graphicHelper, state.project.viewport, x, y);

		if (module) {
			state.graphicHelper.contextMenu.items = menus.moduleMenu(state);
		} else {
			state.graphicHelper.contextMenu.items = menus.mainMenu(state);
		}

		events.on('mousedown', onMouseDown);
		events.on('mousemove', onMouseMove);
	};

	const onOpenSubMenu = event => {
		const { menu } = event;
		state.graphicHelper.contextMenu.items = menus[menu](state);
	};

	events.on('openSubMenu', onOpenSubMenu);
	events.on('contextmenu', onContextMenu);

	return () => {
		events.off('contextmenu', onContextMenu);
	};
}
