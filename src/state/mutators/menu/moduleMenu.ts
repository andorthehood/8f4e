const contextMenu = function (state, events) {
	const onModuleMenu = event => {
		const { y } = event;

		state.ui.contextMenu.highlightedItem = 0;
		state.ui.contextMenu.y = y;
		state.ui.contextMenu.open = true;

		state.ui.contextMenu.items = [
			{ title: '16bit ADC', action: 'addModule', payload: { type: 'adc16bit' }, close: true },
			{ title: '8bit ADC', action: 'addModule', payload: { type: 'adc8bit' }, close: true },
			{ title: 'Abs', action: 'addModule', payload: { type: 'abs' }, close: true },
			{ title: 'Attenuator', action: 'addModule', payload: { type: 'attenuator' }, close: true },
			{ title: 'Bitwise AND', action: 'addModule', payload: { type: 'bitwiseAnd' }, close: true },
			{ title: 'Bitwise OR', action: 'addModule', payload: { type: 'bitwiseOr' }, close: true },
			{ title: 'Bitwise XOR', action: 'addModule', payload: { type: 'bitwiseXor' }, close: true },
			{ title: 'CV2Midi', action: 'addModule', payload: { type: 'cvToMidi' }, close: true },
			{ title: 'Clock generator', action: 'addModule', payload: { type: 'clockGenerator' }, close: true },
			{ title: 'Constant', action: 'addModule', payload: { type: 'constant' }, close: true },
			{ title: 'Invert', action: 'addModule', payload: { type: 'invert' }, close: true },
			{ title: 'Logic AND', action: 'addModule', payload: { type: 'logicAnd' }, close: true },
			{ title: 'Logic Negate', action: 'addModule', payload: { type: 'logicNegate' }, close: true },
			{ title: 'Logic OR', action: 'addModule', payload: { type: 'logicOr' }, close: true },
			{ title: 'Logic XOR', action: 'addModule', payload: { type: 'logicXor' }, close: true },
			{ title: 'Max', action: 'addModule', payload: { type: 'max' }, close: true },
			{ title: 'Min', action: 'addModule', payload: { type: 'min' }, close: true },
			{ title: 'Mixer', action: 'addModule', payload: { type: 'mixer' }, close: true },
			{ title: 'Number', action: 'addModule', payload: { type: 'number' }, close: true },
			{ title: 'Offset', action: 'addModule', payload: { type: 'offset' }, close: true },
			{ title: 'Quantizer', action: 'addModule', payload: { type: 'pianoQuantizer' }, close: true },
			{ title: 'Random generator', action: 'addModule', payload: { type: 'randomGenerator' }, close: true },
			{ title: 'Sample & Hold', action: 'addModule', payload: { type: 'sampleAndHold' }, close: true },
			{ title: 'Saw', action: 'addModule', payload: { type: 'saw' }, close: true },
			{ title: 'Scope', action: 'addModule', payload: { type: 'scope' }, close: true },
			{ title: 'Sequential switch', action: 'addModule', payload: { type: 'sequentialSwitch' }, close: true },
			{ title: 'Splitter', action: 'addModule', payload: { type: 'splitter' }, close: true },
			{ title: 'Swtich', action: 'addModule', payload: { type: 'switch' }, close: true },
			{ title: 'Triangle', action: 'addModule', payload: { type: 'triangle' }, close: true },
		];
	};

	events.on('openModuleMenu', onModuleMenu);

	return () => {
		events.off('openModuleMenu', onModuleMenu);
	};
};

export default contextMenu;
