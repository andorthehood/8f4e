import { StateManager } from '@8f4e/state-manager';

import * as menus from './menus';

import { EventDispatcher } from '../../types';
import findCodeBlockAtViewportCoordinates from '../../pureHelpers/finders/findCodeBlockAtViewportCoordinates';

import type { ContextMenuItem, State } from '../../types';

interface MouseEvent {
	x: number;
	y: number;
	buttons?: number;
	stopPropagation?: boolean;
}

interface MenuEvent {
	menu: string;
	[key: string]: unknown;
}

function getHighlightedMenuItem(x: number, y: number, width: number, height: number) {
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
			title: item.isSectionTitle ? title + ' ' + pad : pad + ' ' + title,
		};
	});
}

export default function contextMenu(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();
	const onMouseMove = (event: MouseEvent) => {
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

	const onMouseDown = (event: MouseEvent) => {
		const { highlightedItem, items } = state.graphicHelper.contextMenu;

		if (items[highlightedItem]) {
			if (items[highlightedItem].selector) {
				store.set(items[highlightedItem].selector, items[highlightedItem].value);
			} else if (items[highlightedItem].action) {
				events.dispatch(items[highlightedItem].action, {
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

	const onContextMenu = async (event: MouseEvent) => {
		if (!state.featureFlags.contextMenu) {
			return;
		}

		const { x, y } = event;

		state.graphicHelper.contextMenu.highlightedItem = 0;
		state.graphicHelper.contextMenu.x =
			Math.round(x / state.graphicHelper.viewport.vGrid) * state.graphicHelper.viewport.vGrid;
		state.graphicHelper.contextMenu.y =
			Math.round(y / state.graphicHelper.viewport.hGrid) * state.graphicHelper.viewport.hGrid;
		state.graphicHelper.contextMenu.open = true;

		const codeBlock = findCodeBlockAtViewportCoordinates(state.graphicHelper, x, y);

		if (codeBlock) {
			state.graphicHelper.contextMenu.items = decorateMenu(await menus.moduleMenu(state));
		} else {
			state.graphicHelper.contextMenu.items = decorateMenu(await menus.mainMenu(state));
		}

		state.graphicHelper.contextMenu.itemWidth =
			getLongestMenuItem(state.graphicHelper.contextMenu.items) * state.graphicHelper.viewport.vGrid;

		events.on('mousedown', onMouseDown);
		events.on('mousemove', onMouseMove);
	};

	const onOpenSubMenu = async (event: MenuEvent) => {
		const { menu, ...payload } = event;
		state.graphicHelper.contextMenu.menuStack.push({ menu, payload });
		state.graphicHelper.contextMenu.items = decorateMenu([
			{ title: '< Back', action: 'menuBack' },
			...(await (menus as Record<string, (state: State, payload?: unknown) => Promise<ContextMenuItem[]>>)[menu](
				state,
				payload
			)),
		]);
		state.graphicHelper.contextMenu.itemWidth =
			getLongestMenuItem(state.graphicHelper.contextMenu.items) * state.graphicHelper.viewport.vGrid;
	};

	const onMenuBack = async () => {
		state.graphicHelper.contextMenu.menuStack.pop();
		const entry = state.graphicHelper.contextMenu.menuStack.pop();

		if (!entry) {
			state.graphicHelper.contextMenu.items = decorateMenu(await menus.mainMenu(state));
			state.graphicHelper.contextMenu.itemWidth =
				getLongestMenuItem(state.graphicHelper.contextMenu.items) * state.graphicHelper.viewport.vGrid;
			return;
		}

		const { menu, payload } = entry;
		state.graphicHelper.contextMenu.items = decorateMenu([
			{ title: '< Back', action: 'menuBack' },
			...(await (menus as Record<string, (state: State, payload?: unknown) => Promise<ContextMenuItem[]>>)[menu](
				state,
				payload
			)),
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
