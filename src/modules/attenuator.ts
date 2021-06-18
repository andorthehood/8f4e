import { ModuleGeneratorProps, ModuleType } from '../state/types';
import singleSliderModule from './templates/singleSliderModule';

export default function attenuator(props: ModuleGeneratorProps): ModuleType {
	return {
		...singleSliderModule(props, { id: 'divisor', minValue: 1, maxValue: 100, resolution: 1 }),
		category: 'Other',
		config: {
			divisor: 1,
		},
		engine: 'attenuator',
		name: 'Attenuator',
	};
}
