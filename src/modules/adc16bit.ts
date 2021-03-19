import { ModuleType } from '../state/types';

const adc8bit: ModuleType = {
	width: 100,
	height: 300,
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		...new Array(16).fill(0).map((item, i) => ({ id: 'out:' + (i + 1), x: 85, y: 20 + i * 15, label: 'bit' + i })),
	],
	name: '16bit ADC',
	switches: [],
	sliders: [],
	steppers: [],
	engine: 'adc',
	config: {
		resolution: 16,
	},
};

export default adc8bit;
