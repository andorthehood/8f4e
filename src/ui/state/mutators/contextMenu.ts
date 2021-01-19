const contextMenu = function (state, events) {
	const onMouseDown = event => {
		state.ui.contextMenu.open = false;
		document.removeEventListener('mousedown', onMouseDown);
	};

	const onContextMenu = event => {
		const x = event.clientX;
		const y = event.clientY;

		event.preventDefault();

		if (!state.ui.contextMenu) {
			state.ui.contextMenu = {};
		}
		state.ui.contextMenu.open = true;
		state.ui.contextMenu.position = [x, y];
		state.ui.contextMenu.items = ['Hello', 'Close'];

		document.addEventListener('mousedown', onMouseDown);

		return false;
	};

	document.addEventListener('contextmenu', onContextMenu);

	return () => {
		document.removeEventListener('contextmenu', onContextMenu);
	};
};

export default contextMenu;
