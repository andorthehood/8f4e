import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from 'compiler';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import singleSliderModule from './templates/singleSliderModule';

export default function constant(props: ModuleGeneratorProps): ModuleType {
	return {
		...singleSliderModule(props, {
			id: 'out',
			minValue: I16_SIGNED_SMALLEST_NUMBER,
			maxValue: I16_SIGNED_LARGEST_NUMBER,
			resolution: 100,
		}),
		category: 'Other',
		engine: { name: 'constant', config: {} },
		initialState: { out: 0 },
		inputs: [],
		name: 'Constant',
	};
}
