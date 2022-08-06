import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import { ModuleGeneratorProps, ModuleType, StepperChangeHandler } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_M } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import { extractState, insertState } from '@8f4e/compiler/dist/modules/buffer';
import { Config } from '@8f4e/compiler/dist/modules/buffer';

const onChangeChannel: StepperChangeHandler = function (module, state, value, stepper) {
	const { memoryBuffer, memoryAddressLookup } = state.compiler;
	const dataAddress = memoryAddressLookup[module.id][stepper.id];
	memoryBuffer[dataAddress] = Math.min(Math.max(memoryBuffer[dataAddress] + value, stepper.minValue), stepper.maxValue);
};

export default function cvToMidiNote({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType<Config> {
	const width = MODULE_WIDTH_M * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;

	return {
		buttons: [],
		category: 'MIDI',
		engine: {
			name: 'buffer',
			config: {
				numberOfPorts: 3,
				numberOfDataPlaceholders: 1,
			},
		},
		height,
		initialState: {},
		inputs: addDefaultInputPositions(
			[
				{ id: 'in:1', label: 'note' },
				{ id: 'in:2', label: 'on/off' },
				{ id: 'in:3', label: 'velocity' },
			],
			vGrid,
			hGrid
		),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: 'CV to MIDI Note',
		outputs: [],
		sliders: [],
		steppers: [
			{
				id: 'data:1',
				label: 'channel',
				x: vGrid * 20,
				y: hGrid * 3,
				width: vGrid * 2,
				height: hGrid,
				minValue: 1,
				maxValue: 8,
				onChange: onChangeChannel,
			},
		],
		width,
		insertState,
		extractState,
	};
}
