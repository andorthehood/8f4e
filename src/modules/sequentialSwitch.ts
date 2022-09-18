import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';
import generateBorderLines from './helpers/generateBorderLines';

import { ModuleType } from '../state/types';

export default function sequentialSwitch(): ModuleType {
	const width = MODULE_WIDTH_S;
	const height = MODULE_HEIGHT_S;

	return {
		buttons: [],
		category: 'Logic',
		engine: { name: 'sequentialSwitch', config: {} },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([
			{ id: 'in:1', label: 'in' },
			{ id: 'in:2', label: 'in' },
			{ id: 'in:3', label: 'in' },
			{ id: 'in:4', label: 'in' },
			{ id: 'in:clock', label: 'clock' },
		]),
		lines: [...generateBorderLines(width, height)],
		name: 'Sequential sw',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		sliders: [],
		steppers: [],
		width,
	};
}
