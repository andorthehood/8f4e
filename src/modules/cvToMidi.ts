import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_M } from './consts';
import generateBorderLines from './helpers/generateBorderLines';

export default function cvToMidi({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	const width = MODULE_WIDTH_M * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;

	return {
		buttons: [],
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
		steppers: [
			{ id: 'channel', x: vGrid * 20, y: hGrid * 2, width: vGrid * 2, height: hGrid, minValue: 1, maxValue: 8 },
		],
		width,
	};
}
