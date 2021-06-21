import { I16_SIGNED_LARGEST_NUMBER } from 'compiler';
import { ModuleGeneratorProps, ModuleType } from '../state/types';
import singleSliderModule from './templates/singleSliderModule';

export default function offset(props: ModuleGeneratorProps): ModuleType {
	return {
		...singleSliderModule(props, { id: 'offset', maxValue: I16_SIGNED_LARGEST_NUMBER, minValue: 0, resolution: 100 }),
		category: 'Other',
		initialState: {
			offset: 0,
		},
		engine: { name: 'offset', config: {} },
		name: 'Offset',
	};
}
