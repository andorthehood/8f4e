import singleSliderModule from './templates/singleSliderModule';
import source, { extractState, insertState } from './engines/triggerGenerator.asm';
import addDefaultInputPositions from './helpers/addDefaultInputPositions';

import { ModuleType, SliderChangeHandler } from '../state/types';

const onChange: SliderChangeHandler = function (module, memoryBuffer, memoryAddressLookup, movement, slider) {
	let { rate } = extractState(memoryBuffer, memoryAddressLookup[module.id].__startAddress);
	rate = Math.min(Math.max(slider.minValue, rate + movement * -1 * slider.resolution), slider.maxValue);
	insertState({ rate }, memoryBuffer, memoryAddressLookup[module.id].__startAddress);
};

export default function triggerGenerator(): ModuleType {
	return {
		...singleSliderModule({
			id: 'rate',
			maxValue: 100,
			minValue: 1,
			resolution: 1,
			onChange,
		}),
		buttons: [],
		category: 'Oscillator',
		engine: { source },
		initialState: { rate: 10 },
		inputs: addDefaultInputPositions([{ id: 'reset' }]),
		name: 'Trigger',
		extractState,
		insertState,
	};
}
