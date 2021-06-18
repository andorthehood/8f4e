import { ModuleGeneratorProps, ModuleType } from '../state/types';
import singleSliderModule from './templates/singleSliderModule';

export default function clockGenerator(props: ModuleGeneratorProps): ModuleType {
	return {
		...singleSliderModule(props, { id: 'rate', maxValue: 3000, minValue: 0, resolution: 10 }),
		category: 'Clock',
		config: {
			rate: 10,
		},
		engine: 'clockGenerator',
		inputs: [],
		name: 'Clock generator',
	};
}
