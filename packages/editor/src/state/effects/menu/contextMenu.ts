import * as menus from './menus';

import { EventDispatcher } from '../../../events';
import findModuleAtViewportCoordinates from '../../helpers/findModuleAtViewportCoordinates';
import { ContextMenuItem, State } from '../../types';

function getHighlightedMenuItem(x, y, width, height) {
	if (x < 0 || x > width || y < 0) {
		return Infinity;
	}
	return Math.floor(y / height);
}

function getLongestMenuItem(menuItems: ContextMenuItem[], min = 16) {
	return menuItems.reduce((acc, curr) => {
		if (!curr.title?.length) {
			return acc;
		}
		return acc < curr.title.length ? curr.title.length : acc;
	}, min);
}

function decorateMenu(menuItems: ContextMenuItem[]) {
	const longest = getLongestMenuItem(menuItems);
	return menuItems.map(item => {
		if (item.divider) {
			return item;
		}

		const title = item.close === false ? item.title + ' >' : item.title;

		const pad = '.'.repeat(longest + 2 - (title?.length || 0));
		return {
			...item,
			title: pad + ' ' + title,
		};
	});
}

export default function contextMenu(state: State, events: EventDispatcher): () => void {
	const onMouseMove = event => {
		const { itemWidth, x, y } = state.graphicHelper.contextMenu;
		state.graphicHelper.contextMenu.highlightedItem = getHighlightedMenuItem(
			event.x - x,
			event.y - y,
			itemWidth,
			state.graphicHelper.viewport.hGrid
		);
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
			const action = items[highlightedItem].action;

			if (action) {
				events.dispatch(action, {
					...items[highlightedItem].payload,
					x: event.x,
					y: event.y,
				});
			}

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
		state.graphicHelper.contextMenu.x =
			Math.round(x / state.graphicHelper.viewport.vGrid) * state.graphicHelper.viewport.vGrid;
		state.graphicHelper.contextMenu.y =
			Math.round(y / state.graphicHelper.viewport.hGrid) * state.graphicHelper.viewport.hGrid;
		state.graphicHelper.contextMenu.open = true;

		const module = findModuleAtViewportCoordinates(state.graphicHelper, x, y);

		if (module) {
			state.graphicHelper.contextMenu.items = decorateMenu(menus.moduleMenu(state));
		} else {
			state.graphicHelper.contextMenu.items = decorateMenu(menus.mainMenu(state));
		}

		state.graphicHelper.contextMenu.itemWidth =
			getLongestMenuItem(state.graphicHelper.contextMenu.items) * state.graphicHelper.viewport.vGrid;

		events.on('mousedown', onMouseDown);
		events.on('mousemove', onMouseMove);
	};

	const onOpenSubMenu = event => {
		const { menu } = event;
		state.graphicHelper.contextMenu.menuStack.push(menu);
		state.graphicHelper.contextMenu.items = decorateMenu([
			{ title: '< Back', action: 'menuBack' },
			...menus[menu](state, event),
		]);
		state.graphicHelper.contextMenu.itemWidth =
			getLongestMenuItem(state.graphicHelper.contextMenu.items) * state.graphicHelper.viewport.vGrid;
	};

	const onMenuBack = () => {
		state.graphicHelper.contextMenu.menuStack.pop();
		const menu = state.graphicHelper.contextMenu.menuStack.pop();

		if (!menu) {
			state.graphicHelper.contextMenu.items = decorateMenu(menus.mainMenu(state));
			state.graphicHelper.contextMenu.itemWidth =
				getLongestMenuItem(state.graphicHelper.contextMenu.items) * state.graphicHelper.viewport.vGrid;
			return;
		}

		state.graphicHelper.contextMenu.items = decorateMenu([
			{ title: '< Back', action: 'menuBack' },
			...menus[menu](state),
		]);
		state.graphicHelper.contextMenu.itemWidth =
			getLongestMenuItem(state.graphicHelper.contextMenu.items) * state.graphicHelper.viewport.vGrid;
	};

	events.on('openSubMenu', onOpenSubMenu);
	events.on('contextmenu', onContextMenu);
	events.on('menuBack', onMenuBack);

	return () => {
		events.off('contextmenu', onContextMenu);
	};
}
