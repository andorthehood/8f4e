import { ModuleType } from '../state/types';

const adc8bit: ModuleType = {
	category: 'Bitwise',
	config: {
		resolution: 8,
	},
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		...new Array(8).fill(0).map((item, i) => ({ id: 'out:' + (i + 1), x: 85, y: 20 + i * 15, label: 'bit' + i })),
	],
	engine: 'adc',
	height: 200,
	name: '8bit ADC',
	sliders: [],
	steppers: [],
	switches: [],
	width: 100,
};

export default adc8bit;
