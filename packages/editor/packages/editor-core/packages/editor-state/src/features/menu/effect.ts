import type { ContextMenuItem, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import roundToGrid from '~/features/viewport/roundToGrid';
import findCodeBlockAtViewportCoordinates from '../code-blocks/utils/finders/findCodeBlockAtViewportCoordinates';
import * as menus from './menus';

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

function getMenuViewportPosition(state: State): { x: number; y: number } {
	const { x, y } = state.contextMenu;
	return {
		x: x - state.viewport.x,
		y: y - state.viewport.y,
	};
}

export default function contextMenu(store: StateManager<State>, events: EventDispatcher): () => void {
	const state = store.getState();
	let disposed = false;
	let menuGeneration = 0;

	const isCurrentMenu = (generation: number): boolean => !disposed && generation === menuGeneration;
	const onMouseMove = (event: MouseEvent) => {
		const { itemWidth } = state.contextMenu;
		const { x, y } = getMenuViewportPosition(state);
		state.contextMenu.highlightedItem = getHighlightedMenuItem(
			event.x - x,
			event.y - y,
			itemWidth,
			state.viewport.hGrid
		);
		event.stopPropagation = true;
	};

	const close = () => {
		menuGeneration++;
		events.off('mousedown', onMouseDown);
		events.off('mousemove', onMouseMove);
		state.contextMenu.open = false;
	};

	const onMouseDown = (event: MouseEvent) => {
		const { highlightedItem, items } = state.contextMenu;
		const item = items[highlightedItem];

		if (item) {
			if (item.close) {
				close();
			}

			if (item.selector) {
				store.set(item.selector, item.value);
			} else if (item.action) {
				events.dispatch(item.action, {
					...item.payload,
					x: event.x,
					y: event.y,
				});
			}
		} else {
			close();
		}

		event.stopPropagation = true;
	};

	const onContextMenu = async (event: MouseEvent) => {
		if (disposed || !state.featureFlags.contextMenu) {
			return;
		}

		const generation = ++menuGeneration;
		const { x, y } = event;

		state.contextMenu.highlightedItem = 0;

		const [roundedX, roundedY] = roundToGrid(x + state.viewport.x, y + state.viewport.y, state.viewport);
		state.contextMenu.x = roundedX;
		state.contextMenu.y = roundedY;

		state.contextMenu.open = true;

		const codeBlock = findCodeBlockAtViewportCoordinates(state, x, y);

		const menuItems = codeBlock ? await menus.moduleMenu(state) : await menus.mainMenu(state);
		if (!isCurrentMenu(generation)) {
			return;
		}

		state.contextMenu.items = decorateMenu(menuItems);
		state.contextMenu.itemWidth = getLongestMenuItem(state.contextMenu.items) * state.viewport.vGrid;

		events.on('mousedown', onMouseDown);
		events.on('mousemove', onMouseMove);
	};

	const onOpenSubMenu = async (event: MenuEvent) => {
		if (disposed) {
			return;
		}

		const generation = ++menuGeneration;
		const { menu, ...payload } = event;
		state.contextMenu.menuStack.push({ menu, payload });
		const menuItems = await (menus as Record<string, (state: State, payload?: unknown) => Promise<ContextMenuItem[]>>)[
			menu
		](state, payload);
		if (!isCurrentMenu(generation)) {
			return;
		}

		state.contextMenu.items = decorateMenu([{ title: '< Back', action: 'menuBack' }, ...menuItems]);
		state.contextMenu.itemWidth = getLongestMenuItem(state.contextMenu.items) * state.viewport.vGrid;
	};

	const onMenuBack = async () => {
		if (disposed) {
			return;
		}

		const generation = ++menuGeneration;
		state.contextMenu.menuStack.pop();
		const entry = state.contextMenu.menuStack.pop();

		if (!entry) {
			const menuItems = await menus.mainMenu(state);
			if (!isCurrentMenu(generation)) {
				return;
			}

			state.contextMenu.items = decorateMenu(menuItems);
			state.contextMenu.itemWidth = getLongestMenuItem(state.contextMenu.items) * state.viewport.vGrid;
			return;
		}

		const { menu, payload } = entry;
		const menuItems = await (menus as Record<string, (state: State, payload?: unknown) => Promise<ContextMenuItem[]>>)[
			menu
		](state, payload);
		if (!isCurrentMenu(generation)) {
			return;
		}

		state.contextMenu.items = decorateMenu([{ title: '< Back', action: 'menuBack' }, ...menuItems]);
		state.contextMenu.itemWidth = getLongestMenuItem(state.contextMenu.items) * state.viewport.vGrid;
	};

	events.on('openSubMenu', onOpenSubMenu);
	events.on('contextmenu', onContextMenu);
	events.on('menuBack', onMenuBack);

	return () => {
		disposed = true;
		close();
		events.off('openSubMenu', onOpenSubMenu);
		events.off('contextmenu', onContextMenu);
		events.off('menuBack', onMenuBack);
	};
}
