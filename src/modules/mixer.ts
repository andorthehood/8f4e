import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';
import generateBorderLines from './helpers/generateBorderLines';

export default function mixer(): ModuleType {
	const width = MODULE_WIDTH_S;
	const height = MODULE_HEIGHT_S;

	return {
		buttons: [],
		category: 'Other',
		engine: { name: 'mixer', config: {} },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in:1' }, { id: 'in:2' }, { id: 'in:3' }, { id: 'in:4' }]),
		lines: [...generateBorderLines(width, height)],
		name: 'Mixer',
		outputs: addDefaultOutputPositions([{ id: 'out' }], width),
		sliders: [],
		steppers: [],
		width,
	};
}
