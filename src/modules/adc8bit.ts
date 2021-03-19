import { ModuleType } from '../state/types';

const adc8bit: ModuleType = {
	width: 100,
	height: 200,
	connectors: [
		{ id: 'in', x: 5, y: 20, isInput: true },
		{ id: 'out:1', x: 85, y: 20 },
		{ id: 'out:2', x: 85, y: 35 },
		{ id: 'out:3', x: 85, y: 50 },
		{ id: 'out:4', x: 85, y: 65 },
		{ id: 'out:5', x: 85, y: 80 },
		{ id: 'out:6', x: 85, y: 95 },
		{ id: 'out:7', x: 85, y: 110 },
		{ id: 'out:8', x: 85, y: 125 },
	],
	name: '8bit ADC',
	switches: [],
	sliders: [],
	steppers: [],
	engine: 'adc8bit',
};

export default adc8bit;
