import singleSliderModule from './templates/singleSliderModule';
import source, { extractState, insertState } from './engines/saw.asm';

import { ModuleType, SliderChangeHandler } from '../state/types';

const onChange: SliderChangeHandler = function (module, memoryBuffer, memoryAddressLookup, movement, slider) {
	let { rate } = extractState(memoryBuffer, memoryAddressLookup[module.id].__startAddress);
	rate = Math.min(Math.max(slider.minValue, rate + movement * -1 * slider.resolution), slider.maxValue);
	insertState({ rate }, memoryBuffer, memoryAddressLookup[module.id].__startAddress);
};

export default function saw(): ModuleType {
	return {
		...singleSliderModule({
			id: 'rate',
			maxValue: 2000,
			minValue: 0,
			resolution: 10,
			onChange,
		}),
		buttons: [],
		category: 'Oscillator',
		engine: { source },
		initialState: { rate: 1000 },
		inputs: [],
		name: 'Saw',
		extractState,
		insertState,
	};
}
