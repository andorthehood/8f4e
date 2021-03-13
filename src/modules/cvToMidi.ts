import { ModuleType } from '../state/types';

const cvToMidi: ModuleType = {
	width: 200,
	height: 100,
	connectors: [
		{ id: 'cvin', x: 5, y: 20, isInput: true, label: 'note in' },
		{ id: 'clockin', x: 5, y: 35, isInput: true, label: 'clock in' },
	],
	name: 'CV to MIDI',
	switches: [],
	sliders: [],
	steppers: [{ id: 'channel', x: 80, y: 10, width: 10, height: 20, minValue: 1, maxValue: 8 }],
	defaultValues: {
		channel: 1,
	},
	engine: '',
};

export default cvToMidi;
