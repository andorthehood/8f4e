import { I16_SIGNED_LARGEST_NUMBER } from 'compiler';
import addDefaultInputPositions from '../helpers/addDefaultInputPositions';
import addDefaultOutputPositions from '../helpers/addDefaultOutputPositions';
import { ModuleType } from '../state/types';
import { MODULE_HEIGHT_S, MODULE_WIDTH_S } from './consts';

const offset: ModuleType = {
	category: 'Other',
	config: {
		offset: 0,
	},
	engine: 'offset',
	height: MODULE_HEIGHT_S,
	inputs: addDefaultInputPositions([{ id: 'in' }]),
	name: 'Offset',
	outputs: addDefaultOutputPositions([{ id: 'out' }], MODULE_WIDTH_S),
	steppers: [],
	sliders: [
		{
			height: 50,
			id: 'offset',
			maxValue: I16_SIGNED_LARGEST_NUMBER,
			minValue: 0,
			resolution: 100,
			width: 10,
			x: 10,
			y: 20,
		},
	],
	switches: [],
	width: MODULE_WIDTH_S,
};

export default offset;
