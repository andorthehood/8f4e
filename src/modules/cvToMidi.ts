import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import { ModuleGeneratorProps, ModuleType, StepperChangeHandler } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_M } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import { extractState, insertState } from 'compiler/modules/through';

const onChangeChannel: StepperChangeHandler = function (module, state, value, stepper) {
	const { memoryBuffer, memoryAddressLookup } = state.compiler;
	const dataAddress = memoryAddressLookup[module.id + '_' + stepper.id] / memoryBuffer.BYTES_PER_ELEMENT;
	memoryBuffer[dataAddress] = Math.min(Math.max(memoryBuffer[dataAddress] + value, stepper.minValue), stepper.maxValue);
};

const onChangeDevice: StepperChangeHandler = function (module, state, value, stepper) {
	const { memoryBuffer, memoryAddressLookup } = state.compiler;
	const dataAddress = memoryAddressLookup[module.id + '_' + stepper.id] / memoryBuffer.BYTES_PER_ELEMENT;
	const maxValue = state.midi.ports.length - 1;
	const minValue = 0;
	const newValue = Math.min(Math.max(memoryBuffer[dataAddress] + value, minValue), maxValue);

	memoryBuffer[dataAddress] = newValue;
	stepper.textValue = state.midi.ports[newValue].name;
};

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
				numberOfDataPlaceholders: 2,
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
			{
				id: 'data:1',
				label: 'channel',
				x: vGrid * 20,
				y: hGrid * 2,
				width: vGrid * 2,
				height: hGrid,
				minValue: 1,
				maxValue: 8,
				onChange: onChangeChannel,
			},
			{
				id: 'data:2',
				label: 'device',
				x: vGrid * 20,
				y: hGrid * 4,
				width: vGrid * 2,
				height: hGrid,
				minValue: 0,
				maxValue: 8,
				onChange: onChangeDevice,
			},
		],
		width,
		insertState,
		extractState,
	};
}
