import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_L, MODULE_WIDTH_S } from './consts';

const adc8bit: ModuleType = {
	category: 'Bitwise',
	config: {
		resolution: 16,
	},
	engine: 'adc',
	height: MODULE_HEIGHT_L,
	inputs: addDefaultInputPositions([{ id: 'in' }]),
	name: '16bit ADC',
	outputs: addDefaultOutputPositions(
		[...new Array(16).fill(0).map((item, i) => ({ id: 'out:' + (i + 1), label: 'bit' + i }))],
		MODULE_WIDTH_S
	),
	sliders: [],
	steppers: [],
	switches: [],
	width: MODULE_WIDTH_S,
};

export default adc8bit;
