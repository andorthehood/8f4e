import { midiNoteToInt16 } from '../../helpers/midi';
import { Note } from '../../midi/enums';

const STRUCTURE_VERSION = 3;

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
			sliders: [],
		},
		clockGenerator: {
			width: 100,
			height: 150,
			connectors: [{ id: 'out', x: 85, y: 20 }],
			name: 'Clock generator',
			switches: [],
			sliders: [{ id: 'rate', x: 10, y: 20, width: 10, height: 50, minValue: 0, maxValue: 3000, resolution: 10 }],
		},
		quantizer: {
			width: 300,
			height: 100,
			connectors: [
				{ id: 'in', x: 5, y: 20, isInput: true },
				{ id: 'out', x: 285, y: 20 },
			],
			switches: [
				{ id: 'note1', onValue: midiNoteToInt16(Note.C0), offValue: -2147483648, x: 40, y: 30, width: 10, height: 10 },
				{
					id: 'note2',
					onValue: midiNoteToInt16(Note.C0_SHARP),
					offValue: -2147483648,
					x: 50,
					y: 30,
					width: 10,
					height: 10,
				},
				{ id: 'note3', onValue: midiNoteToInt16(Note.D0), offValue: -2147483648, x: 60, y: 30, width: 10, height: 10 },
				{
					id: 'note4',
					onValue: midiNoteToInt16(Note.D0_SHARP),
					offValue: -2147483648,
					x: 70,
					y: 30,
					width: 10,
					height: 10,
				},
				{ id: 'note5', onValue: midiNoteToInt16(Note.E0), offValue: -2147483648, x: 80, y: 30, width: 10, height: 10 },
				{ id: 'note6', onValue: midiNoteToInt16(Note.F0), offValue: -2147483648, x: 90, y: 30, width: 10, height: 10 },
				{
					id: 'note7',
					onValue: midiNoteToInt16(Note.F0_SHARP),
					offValue: -2147483648,
					x: 100,
					y: 30,
					width: 10,
					height: 10,
				},
				{ id: 'note8', onValue: midiNoteToInt16(Note.G0), offValue: -2147483648, x: 110, y: 30, width: 10, height: 10 },
				{
					id: 'note9',
					onValue: midiNoteToInt16(Note.G0_SHARP),
					offValue: -2147483648,
					x: 120,
					y: 30,
					width: 10,
					height: 10,
				},
				{
					id: 'note10',
					onValue: midiNoteToInt16(Note.A0),
					offValue: -2147483648,
					x: 130,
					y: 30,
					width: 10,
					height: 10,
				},
				{
					id: 'note11',
					onValue: midiNoteToInt16(Note.A0_SHARP),
					offValue: -2147483648,
					x: 140,
					y: 30,
					width: 10,
					height: 10,
				},
				{
					id: 'note12',
					onValue: midiNoteToInt16(Note.B0),
					offValue: -2147483648,
					x: 150,
					y: 30,
					width: 10,
					height: 10,
				},
			],
			name: 'Quantizer',
			sliders: [],
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
			sliders: [],
		},
		saw: {
			width: 100,
			height: 100,
			connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
			name: 'Saw',
			switches: [],
			sliders: [{ id: 'rate', x: 10, y: 20, width: 10, height: 50, minValue: 0, maxValue: 2000, resolution: 10 }],
			defaultValues: {
				rate: 1000,
			},
		},
		triangle: {
			width: 100,
			height: 100,
			connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
			name: 'Triangle',
			switches: [],
			sliders: [],
		},
		randomGenerator: {
			width: 100,
			height: 100,
			connectors: [{ id: 'out', x: 85, y: 20, isInput: false }],
			name: 'Random',
			switches: [],
			sliders: [],
		},
		scope: {
			width: 100,
			height: 100,
			connectors: [
				{ id: 'in', x: 5, y: 45, isInput: true },
				{ id: 'out', x: 85, y: 45 },
			],
			name: 'Scope',
			switches: [],
			sliders: [],
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
			sliders: [{ id: 'divisor', x: 10, y: 20, width: 10, height: 50, minValue: 1, maxValue: 100, resolution: 1 }],
			defaultValues: {
				divisor: 1,
			},
		},
		offset: {
			width: 100,
			height: 100,
			connectors: [
				{ id: 'in', x: 5, y: 20, isInput: true },
				{ id: 'out', x: 85, y: 20, isInput: false },
			],
			name: 'Offset',
			sliders: [{ id: 'offset', x: 10, y: 20, width: 10, height: 50, minValue: 0, maxValue: 32000, resolution: 100 }],
			defaultValues: {
				offset: 0,
			},
			switches: [],
		},
		switch: {
			width: 50,
			height: 50,
			connectors: [{ id: 'out', x: 35, y: 20, isInput: false }],
			name: 'Switch',
			switches: [],
			sliders: [],
		},
		voltageSource: {
			width: 50,
			height: 50,
			connectors: [{ id: 'out', x: 35, y: 20, isInput: false }],
			name: 'Volt',
			switches: [],
			sliders: [],
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
