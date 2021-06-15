import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_M } from './consts';

export default function cvToMidi({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	return {
		category: 'MIDI',
		config: {
			numberOfPorts: 2,
			dataPlaceholders: [{ id: 'channel' }, { id: 'device' }],
		},
		engine: 'through',
		height: MODULE_HEIGHT_S * hGrid,
		inputs: addDefaultInputPositions(
			[
				{ id: 'in:1', label: 'note in' },
				{ id: 'in:2', label: 'clock in' },
			],
			vGrid,
			hGrid
		),
		name: 'CV to MIDI',
		outputs: [],
		sliders: [],
		steppers: [{ id: 'channel', x: 80, y: 10, width: 10, height: 20, minValue: 1, maxValue: 8 }],
		switches: [],
		width: MODULE_WIDTH_M * vGrid,
	};
}
