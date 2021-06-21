import { ModuleGeneratorProps, ModuleType } from '../state/types';
import singleSliderModule from './templates/singleSliderModule';

export default function saw(props: ModuleGeneratorProps): ModuleType {
	return {
		...singleSliderModule(props, { id: 'rate', maxValue: 2000, minValue: 0, resolution: 10 }),
		category: 'Oscillator',
		engine: { name: 'saw', config: {} },
		initialState: { rate: 1000 },
		inputs: [],
		name: 'Saw',
	};
}
