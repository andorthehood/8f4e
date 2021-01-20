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
		const { itemHeight, itemWidth, position } = state.ui.contextMenu;
		const x = event.clientX - position[0];
		const y = event.clientY - position[1];
		state.ui.contextMenu.highlightedItem = getHighlightedMenuItem(x, y, itemHeight, itemWidth);
	};

	const onMouseDown = event => {
		const { highlightedItem, items } = state.ui.contextMenu;

		if (items[highlightedItem]) {
			events.dispatch(items[highlightedItem].action, {
				...items[highlightedItem].payload,
				x: event.clientX,
				y: event.clientY,
			});
		}

		state.ui.contextMenu.open = false;

		events.off('mousedown', onMouseDown);
		events.off('mousemove', onMouseMove);
	};

	const onContextMenu = event => {
		const x = event.clientX;
		const y = event.clientY;

		state.ui.contextMenu.open = true;
		state.ui.contextMenu.position = [x, y];

		const module = state.ui.modules.findIndex(
			({ position, size }) =>
				x >= position[0] + state.ui.viewport.x &&
				x <= position[0] + size[0] + state.ui.viewport.x &&
				y >= position[1] + state.ui.viewport.y &&
				y <= position[1] + size[1] + state.ui.viewport.y
		);

		if (module !== -1) {
			state.ui.contextMenu.items = [
				{ title: 'Delete module', action: 'deleteModule', payload: { moduleId: module.id } },
				{ title: 'Close', action: 'closeContextMenu' },
			];
		} else {
			state.ui.contextMenu.items = [
				{ title: 'Add module', action: 'addModule' },
				{ title: 'Close', action: 'closeContextMenu' },
			];
		}

		events.on('mousedown', onMouseDown);
		events.on('mousemove', onMouseMove);

		return false;
	};

	events.on('contextmenu', onContextMenu);

	return () => {
		events.off('contextmenu', onContextMenu);
	};
};

export default contextMenu;
