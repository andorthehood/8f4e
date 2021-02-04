import findModuleAtViewportCoordinates from '../helpers/findModuleAtViewportCoordinates';

const getHighlightedMenuItem = function (x, y, itemHeight, width) {
	if (x < 0 || x > width || y < 0) {
		return Infinity;
	}
	return Math.floor(y / itemHeight);
};

const contextMenu = function (state, events) {
	state.ui.contextMenu = {
		open: false,
		items: [],
		itemHeight: 20,
		itemWidth: 200,
		highlightedItem: 0,
	};

	const onMouseMove = event => {
		const { itemHeight, itemWidth, x, y } = state.ui.contextMenu;
		state.ui.contextMenu.highlightedItem = getHighlightedMenuItem(event.x - x, event.y - y, itemHeight, itemWidth);
		event.stopPropagation = true;
	};

	const onMouseDown = event => {
		const { highlightedItem, items } = state.ui.contextMenu;

		if (items[highlightedItem]) {
			events.dispatch(items[highlightedItem].action, {
				...items[highlightedItem].payload,
				x: event.x,
				y: event.y,
			});
		}

		state.ui.contextMenu.open = false;
		event.stopPropagation = true;

		events.off('mousedown', onMouseDown);
		events.off('mousemove', onMouseMove);
	};

	const onContextMenu = event => {
		const { x, y } = event;

		state.ui.contextMenu.highlightedItem = 0;
		state.ui.contextMenu.x = x;
		state.ui.contextMenu.y = y;
		state.ui.contextMenu.open = true;

		const module = findModuleAtViewportCoordinates(state, x, y);

		if (module) {
			state.ui.contextMenu.items = [
				{ title: 'Delete module', action: 'deleteModule', payload: { moduleId: module.id } },
				{ title: 'Remove wires', action: 'deleteConnection', payload: { moduleId: module.id } },
			];
		} else {
			state.ui.contextMenu.items = [
				{ title: 'Add module', action: 'addModule', payload: { type: 'saw' } },
				{ title: 'Undo', action: 'undo' },
				{ title: 'Save', action: 'save' },
				{ title: 'Run test', action: 'runTest' },
				{ title: 'Export', action: 'export' },
			];
		}

		events.on('mousedown', onMouseDown);
		events.on('mousemove', onMouseMove);
	};

	events.on('contextmenu', onContextMenu);

	return () => {
		events.off('contextmenu', onContextMenu);
	};
};

export default contextMenu;
