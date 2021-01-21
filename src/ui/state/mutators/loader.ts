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
			connectors: {
				in: { x: 5, y: 20, isInput: true },
				out1: { x: 5, y: 35 },
				out2: { x: 5, y: 50 },
			},
			name: 'Splitter',
		},
	},
};

const loader = function (state) {
	state.ui = { ...defaultState, ...(JSON.parse(localStorage.getItem('ui')) || {}) };
};

export default loader;
