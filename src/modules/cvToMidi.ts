import { ModuleType } from '../state/types';

const cvToMidi: ModuleType = {
	category: 'MIDI',
	config: {
		channel: 1,
	},
	connectors: [
		{ id: 'in:note', x: 5, y: 20, isInput: true, label: 'note in' },
		{ id: 'in:clock', x: 5, y: 35, isInput: true, label: 'clock in' },
	],
	engine: '',
	height: 100,
	name: 'CV to MIDI',
	sliders: [],
	steppers: [{ id: 'channel', x: 80, y: 10, width: 10, height: 20, minValue: 1, maxValue: 8 }],
	switches: [],
	width: 200,
};

export default cvToMidi;
