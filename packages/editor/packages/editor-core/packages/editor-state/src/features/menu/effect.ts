import type { ContextMenuItem, EventDispatcher, MenuStackEntry, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import roundToGrid from '~/features/viewport/roundToGrid';
import findCodeBlockAtViewportCoordinates from '../code-blocks/utils/finders/findCodeBlockAtViewportCoordinates';
import loadMenuBuilders from './loadMenuBuilders';

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

function keepMenuWithinViewport(state: State): void {
	const { contextMenu, viewport } = state;
	const { x, y } = getMenuViewportPosition(state);
	const maxX = Math.max(viewport.width - contextMenu.itemWidth, 0);
	const maxY = Math.max(viewport.height - contextMenu.items.length * viewport.hGrid, 0);

	contextMenu.x = viewport.x + Math.min(Math.max(x, 0), maxX);
	contextMenu.y = viewport.y + Math.min(Math.max(y, 0), maxY);
}

export default function contextMenu(
	store: StateManager<State>,
	events: EventDispatcher,
	loadBuilders = loadMenuBuilders
): () => void {
	const state = store.getState();
	let disposed = false;
	let active = false;
	let requestId = 0;
	let selectedCodeBlock = state.codeBlockRendering.selectedCodeBlock;
	let codeBlocks = state.codeBlockRendering.codeBlocks;
	let editing = state.featureFlags.editing;
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
		++requestId;
		active = false;
		events.off('mousedown', onMouseDown);
		events.off('mousemove', onMouseMove);
		state.contextMenu.open = false;
		state.contextMenu.menuStack = [];
	};

	const onMouseDown = (event: MouseEvent) => {
		const { highlightedItem, items } = state.contextMenu;
		const item = state.contextMenu.open ? items[highlightedItem] : undefined;

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

	const contextIsCurrent = () =>
		state.featureFlags.contextMenu &&
		state.featureFlags.editing === editing &&
		state.codeBlockRendering.selectedCodeBlock === selectedCodeBlock &&
		state.codeBlockRendering.codeBlocks === codeBlocks;

	const onContextChanged = () => {
		if (active && !contextIsCurrent()) {
			close();
		}
	};

	const onOpenChanged = () => {
		if (!state.contextMenu.open) {
			close();
		}
	};

	const showMenu = async (menu: string, payload: unknown, menuStack: MenuStackEntry[]) => {
		const currentRequest = ++requestId;
		const isCurrent = () => {
			if (disposed || !active || currentRequest !== requestId) {
				return false;
			}
			if (!contextIsCurrent()) {
				close();
				return false;
			}
			return true;
		};

		try {
			const builders = await loadBuilders();
			if (!isCurrent()) {
				return;
			}
			if (!Object.hasOwn(builders, menu)) {
				throw new Error(`Unknown context menu: ${menu}`);
			}
			const items = await builders[menu as keyof typeof builders](state, payload);
			if (!isCurrent()) {
				return;
			}
			state.contextMenu.items = decorateMenu([
				...(menuStack.length ? [{ title: '< Back', action: 'menuBack' }] : []),
				...items,
			]);
			state.contextMenu.menuStack = menuStack;
			state.contextMenu.highlightedItem = 0;
			state.contextMenu.itemWidth = getLongestMenuItem(state.contextMenu.items) * state.viewport.vGrid;
			keepMenuWithinViewport(state);
			state.contextMenu.open = true;
		} catch (error) {
			if (isCurrent()) {
				close();
				console.error('Failed to open context menu:', error);
			}
		}
	};

	const onContextMenu = async (event: MouseEvent) => {
		if (disposed || !state.featureFlags.contextMenu) {
			return;
		}

		close();
		active = true;
		selectedCodeBlock = state.codeBlockRendering.selectedCodeBlock;
		codeBlocks = state.codeBlockRendering.codeBlocks;
		editing = state.featureFlags.editing;

		const { x, y } = event;
		const [roundedX, roundedY] = roundToGrid(x + state.viewport.x, y + state.viewport.y, state.viewport);
		state.contextMenu.x = roundedX;
		state.contextMenu.y = roundedY;

		// Capture dismissal immediately, including while the first import is pending.
		events.on('mousedown', onMouseDown);
		events.on('mousemove', onMouseMove);

		const codeBlock = findCodeBlockAtViewportCoordinates(state, x, y);
		await showMenu(codeBlock ? 'moduleMenu' : 'mainMenu', undefined, []);
	};

	const onOpenSubMenu = async (event: MenuEvent) => {
		if (disposed || !active || !state.featureFlags.contextMenu) {
			return;
		}
		const { menu, ...payload } = event;
		await showMenu(menu, payload, [...state.contextMenu.menuStack, { menu, payload }]);
	};

	const onMenuBack = async () => {
		if (disposed || !active || !state.featureFlags.contextMenu) {
			return;
		}
		const menuStack = state.contextMenu.menuStack.slice(0, -1);
		const entry = menuStack.at(-1);
		await showMenu(entry?.menu ?? 'mainMenu', entry?.payload, menuStack);
	};

	events.on('openSubMenu', onOpenSubMenu);
	events.on('contextmenu', onContextMenu);
	events.on('menuBack', onMenuBack);
	store.subscribe('codeBlockRendering.selectedCodeBlock', onContextChanged);
	store.subscribe('codeBlockRendering.codeBlocks', onContextChanged);
	store.subscribe('featureFlags', onContextChanged);
	store.subscribe('contextMenu.open', onOpenChanged);

	return () => {
		disposed = true;
		close();
		events.off('contextmenu', onContextMenu);
		events.off('openSubMenu', onOpenSubMenu);
		events.off('menuBack', onMenuBack);
		store.unsubscribe('codeBlockRendering.selectedCodeBlock', onContextChanged);
		store.unsubscribe('codeBlockRendering.codeBlocks', onContextChanged);
		store.unsubscribe('featureFlags', onContextChanged);
		store.unsubscribe('contextMenu.open', onOpenChanged);
	};
}
