import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import { ModuleGeneratorProps, ModuleType, StepperChangeHandler } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_M } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import { extractState, insertState } from 'compiler/modules/buffer';
import ccNames from '../midi/ccNames';

const onChange: StepperChangeHandler = function (module, state, value, stepper) {
	const { memoryBuffer, memoryAddressLookup } = state.compiler;
	const dataAddress = memoryAddressLookup[module.id + '_' + stepper.id] / memoryBuffer.BYTES_PER_ELEMENT;

	memoryBuffer[dataAddress] = Math.min(Math.max(memoryBuffer[dataAddress] + value, stepper.minValue), stepper.maxValue);

	if (stepper.label === 'cc') {
		stepper.textValue = ccNames[memoryBuffer[dataAddress]].name;
	}
};

export default function cvToMidiCC({ vGrid, hGrid }: ModuleGeneratorProps): ModuleType {
	const width = MODULE_WIDTH_M * vGrid;
	const height = MODULE_HEIGHT_S * hGrid;

	return {
		buttons: [],
		category: 'MIDI',
		engine: {
			name: 'buffer',
			config: {
				numberOfPorts: 3,
				numberOfDataPlaceholders: 2,
			},
		},
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in:1', label: 'in' }], vGrid, hGrid),
		lines: [...generateBorderLines(vGrid, hGrid, width, height)],
		name: 'CV to MIDI CC',
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
				onChange: onChange,
			},
			{
				id: 'data:2',
				label: 'cc',
				x: vGrid * 20,
				y: hGrid * 4,
				width: vGrid * 2,
				height: hGrid,
				minValue: 1,
				maxValue: 127,
				onChange: onChange,
			},
		],
		width,
		insertState,
		extractState,
	};
}
