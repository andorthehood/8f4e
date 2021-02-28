const contextMenu = function (state, events) {
	const onModuleMenu = event => {
		const { y } = event;

		state.ui.contextMenu.highlightedItem = 0;
		state.ui.contextMenu.y = y;
		state.ui.contextMenu.open = true;

		state.ui.contextMenu.items = [
			{ title: 'Saw', action: 'addModule', payload: { type: 'saw' }, close: true },
			{ title: 'Triangle', action: 'addModule', payload: { type: 'triangle' }, close: true },
			{ title: 'Splitter', action: 'addModule', payload: { type: 'splitter' }, close: true },
			{ title: 'Clock generator', action: 'addModule', payload: { type: 'clockGenerator' }, close: true },
			{ title: 'Random generator', action: 'addModule', payload: { type: 'randomGenerator' }, close: true },
			{ title: 'Quantizer', action: 'addModule', payload: { type: 'quantizer' }, close: true },
			{ title: 'Scope', action: 'addModule', payload: { type: 'scope' }, close: true },
			{ title: 'Attenuator', action: 'addModule', payload: { type: 'attenuator' }, close: true },
			{ title: 'Swtich', action: 'addModule', payload: { type: 'switch' }, close: true },
			{ title: 'Volt', action: 'addModule', payload: { type: 'voltageSource' }, close: true },
			{ title: 'CV2Midi', action: 'addModule', payload: { type: 'cvToMidi' }, close: true },
			{ title: 'Offset', action: 'addModule', payload: { type: 'offset' }, close: true },
			{ title: 'Sequential switch', action: 'addModule', payload: { type: 'sequentialSwitch' }, close: true },
			{ title: 'And', action: 'addModule', payload: { type: 'and' }, close: true },
			{ title: 'Or', action: 'addModule', payload: { type: 'or' }, close: true },
			{ title: 'Xor', action: 'addModule', payload: { type: 'xor' }, close: true },
		];
	};

	events.on('openModuleMenu', onModuleMenu);

	return () => {
		events.off('openModuleMenu', onModuleMenu);
	};
};

export default contextMenu;
