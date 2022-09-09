import addDefaultInputPositions from './helpers/addDefaultInputPositions';
import addDefaultOutputPositions from './helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_L, MODULE_WIDTH_S } from './consts';
import generateBorderLines from './helpers/generateBorderLines';
import { Config } from '@8f4e/synth-compiler/dist/modules/adc.asm';

export default function adc8bit(): ModuleType<Config> {
	const width = MODULE_WIDTH_S;
	const height = MODULE_HEIGHT_L;

	return {
		buttons: [],
		category: 'Bitwise',
		engine: { name: 'adc', config: { resolution: 16 } },
		height,
		initialState: {},
		inputs: addDefaultInputPositions([{ id: 'in' }]),
		lines: [...generateBorderLines(width, height)],
		name: '16bit ADC',
		outputs: addDefaultOutputPositions(
			[...new Array(16).fill(0).map((item, i) => ({ id: 'out:' + (i + 1), label: 'bit' + i }))],
			width
		),
		sliders: [],
		steppers: [],
		width,
	};
}
