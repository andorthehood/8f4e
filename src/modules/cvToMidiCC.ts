import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import { ModuleType, StepperChangeHandler } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_M } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import { extractState, insertState } from '@8f4e/synth-compiler/dist/modules/buffer.asm';
import ccNames from '../midi/ccNames';
import { Config } from '@8f4e/synth-compiler/dist/modules/buffer.asm';
import { HGRID, VGRID } from '../view/drawers/consts';

const onChange: StepperChangeHandler = function (module, state, value, stepper) {
	const { memoryBuffer, memoryAddressLookup } = state.compiler;
	const dataAddress = memoryAddressLookup[module.id][stepper.id];

	memoryBuffer[dataAddress] = Math.min(Math.max(memoryBuffer[dataAddress] + value, stepper.minValue), stepper.maxValue);

	if (stepper.label === 'cc') {
		stepper.textValue = ccNames[memoryBuffer[dataAddress]].name;
	}
};

export default function cvToMidiCC(): ModuleType<Config> {
	const width = MODULE_WIDTH_M;
	const height = MODULE_HEIGHT_S;

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
		inputs: addDefaultInputPositions([{ id: 'in:1', label: 'in' }]),
		lines: [...generateBorderLines(width, height)],
		name: 'CV to MIDI CC',
		outputs: [],
		sliders: [],
		steppers: [
			{
				id: 'data:1',
				label: 'channel',
				x: VGRID * 10,
				y: HGRID * 3,
				width: VGRID * 2,
				height: HGRID,
				minValue: 1,
				maxValue: 8,
				onChange: onChange,
			},
			{
				id: 'data:2',
				label: 'cc',
				x: VGRID * 10,
				y: HGRID * 4,
				width: VGRID * 2,
				height: HGRID,
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
