const contextMenu = function (state, events) {
	const onModuleMenu = event => {
		const { y } = event;

		state.ui.contextMenu.highlightedItem = 0;
		state.ui.contextMenu.y = y;
		state.ui.contextMenu.open = true;

		state.ui.contextMenu.items = [
			{ title: 'Saw', action: 'addModule', payload: { type: 'saw' }, close: true },
			{ title: 'Splitter', action: 'addModule', payload: { type: 'splitter' }, close: true },
			{ title: 'Clock generator', action: 'addModule', payload: { type: 'clockGenerator' }, close: true },
			{ title: 'Random generator', action: 'addModule', payload: { type: 'randomGenerator' }, close: true },
			{ title: 'Quantizer', action: 'addModule', payload: { type: 'quantizer' }, close: true },
			{ title: 'Scope', action: 'addModule', payload: { type: 'scope' }, close: true },
		];
	};

	events.on('openModuleMenu', onModuleMenu);

	return () => {
		events.off('openModuleMenu', onModuleMenu);
	};
};

export default contextMenu;
