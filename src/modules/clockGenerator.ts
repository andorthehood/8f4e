import singleSliderModule from './templates/singleSliderModule';
import source, { extractState, insertState } from './engines/clockGenerator.asm';

import { ModuleType, SliderChangeHandler } from '../state/types';

const onChange: SliderChangeHandler = function (module, memoryBuffer, memoryAddressLookup, movement, slider) {
	let { rate } = extractState(memoryBuffer, memoryAddressLookup[module.id].__startAddress);
	rate = Math.min(Math.max(slider.minValue, rate + movement * -1 * slider.resolution), slider.maxValue);
	insertState({ rate }, memoryBuffer, memoryAddressLookup[module.id].__startAddress);
};

export default function clockGenerator(): ModuleType {
	return {
		...singleSliderModule({
			id: 'rate',
			maxValue: 3000,
			minValue: 0,
			resolution: 10,
			onChange,
		}),
		buttons: [],
		category: 'Clock',
		engine: { source },
		initialState: { rate: 10 },
		inputs: [],
		name: 'Clock',
		extractState,
		insertState,
	};
}
