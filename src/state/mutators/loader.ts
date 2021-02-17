const defaultState = {
	modules: [
		{
			beingDragged: false,
			id: 'cvToMidi1',
			isSelected: false,
			type: 'cvToMidi',
			x: 0,
			y: 0,
		},
	],
	connections: [],
	isDebugMode: process.env.NODE_ENV === 'development',
	compiler: {
		compilationTime: 0,
		isCompiling: false,
		outputAddressLookup: {},
		memoryBuffer: [],
	},
	viewport: {
		width: 0,
		height: 0,
		x: 0,
		y: 0,
	},
	midi: {
		ports: [],
	},
	error: {
		display: false,
		message: '',
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
		clockGenerator: {
			width: 100,
			height: 150,
			connectors: [{ id: 'out', x: 85, y: 20 }],
			name: 'Clock generator',
		},
		quantizer: {
			width: 300,
			height: 100,
			connectors: [
				{ id: 'in', x: 5, y: 20, isInput: true },
				{ id: 'out', x: 285, y: 20 },
			],
			toggleSwitches: [
				{ id: 'c', onValue: 230, offValue: 0, isOn: false, x: 40, y: 40, width: 10, height: 10 },
				{ id: 'c#', onValue: 240, offValue: 0, isOn: false, x: 30, y: 30, width: 10, height: 10 },
			],
			name: 'Quantizer',
		},
		cvToMidi: {
			width: 100,
			height: 200,
			connectors: [
				{ id: 'cvin', x: 5, y: 20, isInput: true },
				{ id: 'clockin', x: 5, y: 35, isInput: true },
			],
			name: 'CV to MIDI',
		},
		saw: {
			width: 100,
			height: 100,
			connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
			name: 'Saw',
		},
		triangle: {
			width: 100,
			height: 100,
			connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
			name: 'Triangle',
		},
		randomGenerator: {
			width: 100,
			height: 100,
			connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
			name: 'Random',
		},
		scope: {
			width: 100,
			height: 100,
			connectors: [
				{ id: 'in', x: 5, y: 20, isInput: true },
				{ id: 'out', x: 85, y: 20 },
			],
			name: 'Scope',
		},
		attenuator: {
			width: 100,
			height: 100,
			connectors: [
				{ id: 'out', x: 85, y: 20, isInput: false },
				{ id: 'in', x: 5, y: 20, isInput: true },
			],
			name: 'Attenuator',
		},
	},
};

const loader = function (state, events) {
	state.ui = { ...defaultState, ...(JSON.parse(localStorage.getItem('state')) || {}) };
	state.history = [];

	// @ts-ignore
	window.state = state;

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
