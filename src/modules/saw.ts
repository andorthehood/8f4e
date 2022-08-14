import { ModuleGeneratorProps, ModuleType, SliderChangeHandler } from '../state/types';
import singleSliderModule from './templates/singleSliderModule';
import { extractState, insertState } from '@8f4e/synth-compiler/dist/modules/saw';

const onChange: SliderChangeHandler = function (module, memoryBuffer, memoryAddressLookup, movement, slider) {
	let { rate } = extractState(memoryBuffer, memoryAddressLookup[module.id].__startAddress);
	rate = Math.min(Math.max(slider.minValue, rate + movement * -1 * slider.resolution), slider.maxValue);
	insertState({ rate }, memoryBuffer, memoryAddressLookup[module.id].__startAddress);
};

export default function saw(props: ModuleGeneratorProps): ModuleType {
	return {
		...singleSliderModule(props, { id: 'rate', maxValue: 2000, minValue: 0, resolution: 10, onChange }),
		category: 'Oscillator',
		engine: { name: 'saw', config: {} },
		initialState: { rate: 1000 },
		inputs: [],
		name: 'Saw',
		extractState,
		insertState,
	};
}
