import { ModuleGeneratorProps, ModuleType, SliderChangeHandler } from '../state/types';
import singleSliderModule from './templates/singleSliderModule';
import { extractState, insertState } from '@8f4e/synth-compiler/dist/modules/clockGenerator';

const onChange: SliderChangeHandler = function (module, memoryBuffer, memoryAddressLookup, movement, slider) {
	let { rate } = extractState(memoryBuffer, memoryAddressLookup[module.id].__startAddress);
	rate = Math.min(Math.max(slider.minValue, rate + movement * -1 * slider.resolution), slider.maxValue);
	insertState({ rate }, memoryBuffer, memoryAddressLookup[module.id].__startAddress);
};

export default function clockGenerator(props: ModuleGeneratorProps): ModuleType {
	return {
		...singleSliderModule(props, { id: 'rate', maxValue: 3000, minValue: 0, resolution: 10, onChange }),
		category: 'Clock',
		engine: { name: 'clockGenerator', config: {} },
		initialState: { rate: 10 },
		inputs: [],
		name: 'Clock generator',
		extractState,
		insertState,
	};
}
