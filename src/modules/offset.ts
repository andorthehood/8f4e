import { I16_SIGNED_LARGEST_NUMBER } from '@8f4e/compiler';
import { ModuleGeneratorProps, ModuleType, SliderChangeHandler } from '../state/types';
import singleSliderModule from './templates/singleSliderModule';

import { extractState, insertState } from 'compiler/dist/modules/offset';

const onChange: SliderChangeHandler = function (module, memoryBuffer, memoryAddressLookup, movement, slider) {
	let { offset } = extractState(memoryBuffer, memoryAddressLookup[module.id].__startAddress);
	offset = Math.min(Math.max(slider.minValue, offset + movement * -1 * slider.resolution), slider.maxValue);
	insertState({ offset }, memoryBuffer, memoryAddressLookup[module.id].__startAddress);
};

export default function offset(props: ModuleGeneratorProps): ModuleType {
	return {
		...singleSliderModule(props, {
			id: 'offset',
			maxValue: I16_SIGNED_LARGEST_NUMBER,
			minValue: 0,
			resolution: 100,
			onChange,
		}),
		category: 'Other',
		initialState: {
			offset: 0,
		},
		engine: { name: 'offset', config: {} },
		name: 'Offset',
		extractState,
		insertState,
	};
}
