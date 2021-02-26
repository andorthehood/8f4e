const STRUCTURE_VERSION = 2;

const defaultState = {
	modules: [],
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
			switches: [],
		},
		clockGenerator: {
			width: 100,
			height: 150,
			connectors: [{ id: 'out', x: 85, y: 20 }],
			name: 'Clock generator',
			switches: [],
		},
		quantizer: {
			width: 300,
			height: 100,
			connectors: [
				{ id: 'in', x: 5, y: 20, isInput: true },
				{ id: 'out', x: 285, y: 20 },
			],
			switches: [
				{ id: 'note1', onValue: 2030, offValue: 0, x: 40, y: 30, width: 10, height: 10 },
				{ id: 'note2', onValue: 20040, offValue: 0, x: 50, y: 30, width: 10, height: 10 },
				{ id: 'note3', onValue: 240, offValue: 0, x: 60, y: 30, width: 10, height: 10 },
				{ id: 'note4', onValue: 240, offValue: 0, x: 70, y: 30, width: 10, height: 10 },
				{ id: 'note5', onValue: 240, offValue: 0, x: 80, y: 30, width: 10, height: 10 },
				{ id: 'note6', onValue: 240, offValue: 0, x: 90, y: 30, width: 10, height: 10 },
				{ id: 'note7', onValue: 240, offValue: 0, x: 100, y: 30, width: 10, height: 10 },
			],
			name: 'Quantizer',
		},
		cvToMidi: {
			width: 200,
			height: 100,
			connectors: [
				{ id: 'cvin', x: 5, y: 20, isInput: true, label: 'note in' },
				{ id: 'clockin', x: 5, y: 35, isInput: true, label: 'clock in' },
			],
			name: 'CV to MIDI',
			switches: [],
		},
		saw: {
			width: 100,
			height: 100,
			connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
			sliders: [{ id: 'rate' }],
			name: 'Saw',
			switches: [],
		},
		triangle: {
			width: 100,
			height: 100,
			connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
			name: 'Triangle',
			switches: [],
		},
		randomGenerator: {
			width: 100,
			height: 100,
			connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
			name: 'Random',
			switches: [],
		},
		scope: {
			width: 100,
			height: 100,
			connectors: [
				{ id: 'in', x: 5, y: 20, isInput: true },
				{ id: 'out', x: 85, y: 20 },
			],
			name: 'Scope',
			switches: [],
		},
		attenuator: {
			width: 100,
			height: 100,
			connectors: [
				{ id: 'out', x: 85, y: 20, isInput: false },
				{ id: 'in', x: 5, y: 20, isInput: true },
			],
			name: 'Attenuator',
			switches: [],
		},
		switch: {
			width: 50,
			height: 50,
			connectors: [{ id: 'out', x: 35, y: 20, isInput: false }],
			name: 'Switch',
			switches: [],
		},
		voltageSource: {
			width: 50,
			height: 50,
			connectors: [{ id: 'out', x: 35, y: 20, isInput: false }],
			name: 'Volt',
			switches: [],
		},
	},
};

const loader = function (state, events) {
	state.ui = { ...defaultState, ...(JSON.parse(localStorage.getItem('state')) || {}) };
	if (state.ui.sructureVersion !== STRUCTURE_VERSION) {
		state.ui = { sructureVersion: STRUCTURE_VERSION, ...defaultState };
	}
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
				sructureVersion: state.ui.sructureVersion,
			})
		);
	};

	events.on('saveState', onSaveState);
};

export default loader;
