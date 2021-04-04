import { ModuleType } from '../state/types';

const adc8bit: ModuleType = {
	width: 100,
	height: 200,
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		...new Array(8).fill(0).map((item, i) => ({ id: 'out:' + (i + 1), x: 85, y: 20 + i * 15, label: 'bit' + i })),
	],
	name: '8bit ADC',
	switches: [],
	sliders: [],
	steppers: [],
	engine: 'adc',
	config: {
		resolution: 8,
	},
	category: 'Bitwise',
};

export default adc8bit;
