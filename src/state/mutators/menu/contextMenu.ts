import findModuleAtViewportCoordinates from '../../helpers/findModuleAtViewportCoordinates';

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

	const close = () => {
		events.off('mousedown', onMouseDown);
		events.off('mousemove', onMouseMove);
		state.ui.contextMenu.open = false;
	};

	const onMouseDown = event => {
		const { highlightedItem, items } = state.ui.contextMenu;

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

		state.ui.contextMenu.highlightedItem = 0;
		state.ui.contextMenu.x = x;
		state.ui.contextMenu.y = y;
		state.ui.contextMenu.open = true;

		const module = findModuleAtViewportCoordinates(state.ui, x, y);

		if (module) {
			state.ui.contextMenu.items = [
				{ title: 'Delete module', action: 'deleteModule', payload: { moduleId: module.id }, close: true },
				{ title: 'Remove wires', action: 'deleteConnection', payload: { moduleId: module.id }, close: true },
			];
		} else {
			state.ui.contextMenu.items = [
				{ title: 'Add module', action: 'openModuleMenu' },
				{ title: 'Undo', action: 'undo', close: true },
				{ title: 'Run test', action: 'runTest', close: true },
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
};

export default contextMenu;
