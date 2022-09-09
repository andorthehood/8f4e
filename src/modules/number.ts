import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import { Config } from '@8f4e/synth-compiler/dist/modules/buffer';

export default function number(): ModuleType<Config> {
	const width = MODULE_WIDTH_S;
	const height = MODULE_HEIGHT_S;

	return {
		buttons: [],
		category: 'Inspection',
		engine: { name: 'buffer', config: { numberOfPorts: 1 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in:1', label: 'in' }]),
		lines: [...generateBorderLines(width, height)],
		name: 'Number',
		outputs: addDefaultOutputPositions([{ id: 'out:1', label: 'out' }], width),
		sliders: [],
		steppers: [],
		width,
	};
}
