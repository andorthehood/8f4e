import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import { ModuleType } from '../state/types';
import { MODULE_WIDTH_M } from './consts';

const cvToMidi: ModuleType = {
	category: 'MIDI',
	config: {
		numberOfPorts: 2,
		dataPlaceholders: [{ id: 'channel' }, { id: 'device' }],
	},
	engine: 'through',
	height: 10,
	inputs: addDefaultInputPositions([
		{ id: 'in:1', label: 'note in' },
		{ id: 'in:2', label: 'clock in' },
	]),
	name: 'CV to MIDI',
	outputs: [],
	sliders: [],
	steppers: [{ id: 'channel', x: 80, y: 10, width: 10, height: 20, minValue: 1, maxValue: 8 }],
	switches: [],
	width: MODULE_WIDTH_M,
};

export default cvToMidi;
