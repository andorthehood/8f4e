import { ModuleType } from '../state/types';

const adc8bit: ModuleType = {
	category: 'Bitwise',
	config: {
		resolution: 16,
	},
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		...new Array(16).fill(0).map((item, i) => ({ id: 'out:' + (i + 1), x: 85, y: 20 + i * 15, label: 'bit' + i })),
	],
	engine: 'adc',
	height: 300,
	name: '16bit ADC',
	sliders: [],
	steppers: [],
	switches: [],
	width: 100,
};

export default adc8bit;
