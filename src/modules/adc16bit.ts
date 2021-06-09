import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';

const adc8bit: ModuleType = {
	category: 'Bitwise',
	config: {
		resolution: 16,
	},
	engine: 'adc',
	height: 30,
	inputs: addDefaultInputPositions([{ id: 'in' }]),
	name: '16bit ADC',
	outputs: addDefaultOutputPositions(
		[...new Array(16).fill(0).map((item, i) => ({ id: 'out:' + (i + 1), label: 'bit' + i }))],
		20
	),
	sliders: [],
	steppers: [],
	switches: [],
	width: 20,
};

export default adc8bit;
