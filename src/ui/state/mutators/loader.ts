const defaultState = {
	modules: [],
	connections: [],
	viewport: {
		width: 0,
		height: 0,
		x: 0,
		y: 0,
	},
	moduleTypes: {
		splitter: {
			width: 100,
			height: 100,
			connectors: [
				{ id: 'in', x: 5, y: 20, isInput: true },
				{ id: 'out1', x: 85, y: 20 },
				{ id: 'out2', x: 85, y: 35 },
				{ id: 'out3', x: 85, y: 50 },
				{ id: 'out4', x: 85, y: 65 },
			],
			name: 'Splitter',
		},
	},
};

const loader = function (state, events) {
	state.ui = { ...defaultState, ...(JSON.parse(localStorage.getItem('state')) || {}) };

	const onSaveState = () => {
		localStorage.setItem(
			'state',
			JSON.stringify({
				viewport: state.ui.viewport,
				connections: state.ui.connections,
				modules: state.ui.modules,
			})
		);
	};

	events.on('saveState', onSaveState);
};

export default loader;
