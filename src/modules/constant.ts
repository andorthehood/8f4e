import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '@8f4e/synth-compiler';
import { ModuleGeneratorProps, ModuleType, SliderChangeHandler } from '../state/types';
import singleSliderModule from './templates/singleSliderModule';
import { extractState, insertState } from '@8f4e/synth-compiler/dist/modules/constant.asm';

const onChange: SliderChangeHandler = function (module, memoryBuffer, memoryAddressLookup, movement, slider) {
	let { out } = extractState(memoryBuffer, memoryAddressLookup[module.id].__startAddress);
	out = Math.min(Math.max(slider.minValue, out + movement * -1 * slider.resolution), slider.maxValue);
	insertState({ out }, memoryBuffer, memoryAddressLookup[module.id].__startAddress);
};

export default function constant(props: ModuleGeneratorProps): ModuleType {
	return {
		...singleSliderModule(props, {
			id: 'out',
			minValue: I16_SIGNED_SMALLEST_NUMBER,
			maxValue: I16_SIGNED_LARGEST_NUMBER,
			resolution: 100,
			onChange,
		}),
		category: 'Other',
		engine: { name: 'constant', config: {} },
		initialState: { out: 0 },
		inputs: [],
		name: 'Constant',
		insertState,
		extractState,
	};
}
