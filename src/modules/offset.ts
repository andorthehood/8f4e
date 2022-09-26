import { I16_SIGNED_LARGEST_NUMBER } from '@8f4e/compiler';

import singleSliderModule from './templates/singleSliderModule';
import source, { extractState, insertState } from './engines/offset.asm';

import { ModuleType, SliderChangeHandler } from '../state/types';

const onChange: SliderChangeHandler = function (module, memoryBuffer, memoryAddressLookup, movement, slider) {
	let { offset } = extractState(memoryBuffer, memoryAddressLookup[module.id].__startAddress);
	offset = Math.min(Math.max(slider.minValue, offset + movement * -1 * slider.resolution), slider.maxValue);
	insertState({ offset }, memoryBuffer, memoryAddressLookup[module.id].__startAddress);
};

export default function offset(): ModuleType {
	return {
		...singleSliderModule({
			id: 'offset',
			maxValue: I16_SIGNED_LARGEST_NUMBER,
			minValue: 0,
			resolution: 100,
			onChange,
		}),
		buttons: [],
		category: 'Other',
		initialState: {
			offset: 0,
		},
		engine: { source },
		name: 'Offset',
		extractState,
		insertState,
	};
}
