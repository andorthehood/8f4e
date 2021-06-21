import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_M } from './consts';
import generateBorderLines from './helpers/generateBorderLines';

export default function cvToMidi({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	const width = MODULE_WIDTH_M * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;

	return {
		category: 'MIDI',
		engine: {
			name: 'through',
			config: {
				numberOfPorts: 2,
				dataPlaceholders: [{ id: 'channel' }, { id: 'device' }],
			},
		},
		height,
		initialState: {},
		inputs: addDefaultInputPositions(
			[
				{ id: 'in:1', label: 'note in' },
				{ id: 'in:2', label: 'clock in' },
			],
			vGrid,
			hGrid
		),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: 'CV to MIDI',
		outputs: [],
		sliders: [],
		steppers: [{ id: 'channel', x: 80, y: 10, width: 10, height: 20, minValue: 1, maxValue: 8 }],
		switches: [],
		width,
	};
}
