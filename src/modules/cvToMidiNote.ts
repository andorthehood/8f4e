import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import source, { extractState, insertState } from './engines/buffer.asm';

import { ModuleType, StepperChangeHandler } from '../state/types';
import { HGRID, VGRID } from '../view/drawers/consts';

const onChangeChannel: StepperChangeHandler = function (module, state, value, stepper) {
	const { memoryBuffer, memoryAddressLookup } = state.compiler;
	const dataAddress = memoryAddressLookup[module.id][stepper.id];
	memoryBuffer[dataAddress] = Math.min(Math.max(memoryBuffer[dataAddress] + value, stepper.minValue), stepper.maxValue);
};

export default function cvToMidiNote(): ModuleType {
	const width = 16 * HGRID;
	const height = 8 * HGRID;

	return {
		buttons: [],
		category: 'MIDI',
		engine: {
			source: source({
				numberOfPorts: 3,
				numberOfDataPlaceholders: 1,
			}),
		},
		height,
		initialState: {},
		inputs: addDefaultInputPositions([
			{ id: 'in:1', label: 'note' },
			{ id: 'in:2', label: 'on/off' },
			{ id: 'in:3', label: 'velocity' },
		]),
		name: 'CV to MIDI Note',
		outputs: [],
		steppers: [
			{
				id: 'data:1',
				label: 'channel',
				x: VGRID * 14,
				y: HGRID * 2,
				upHitArea: {
					x: VGRID * 4,
					y: 0,
					width: 3 * VGRID,
					height: HGRID,
				},
				downHitArea: {
					x: 0,
					y: 0,
					width: 3 * VGRID,
					height: HGRID,
				},
				minValue: 1,
				maxValue: 8,
				onChange: onChangeChannel,
				width: VGRID * 7,
				height: HGRID,
			},
		],
		width,
		insertState,
		extractState,
	};
}
