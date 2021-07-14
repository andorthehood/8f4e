import { CompiledModule, MemoryAddressLookup, MemoryBuffer } from '../../compiler/src';
import { MidiModuleAddresses } from './types';

export default function findMidiNoteModules(
	compiledModules: CompiledModule[],
	memoryBuffer: MemoryBuffer,
	memoryAddressLookup: MemoryAddressLookup
): MidiModuleAddresses[] {
	return compiledModules
		.filter(({ moduleId }) => moduleId.startsWith('cvToMidiNote'))
		.map(module => {
			return {
				moduleId: module.moduleId,
				noteAddress: memoryAddressLookup[module.moduleId]['out:1'] / memoryBuffer.BYTES_PER_ELEMENT,
				channelAddress: memoryAddressLookup[module.moduleId]['data:1'] / memoryBuffer.BYTES_PER_ELEMENT,
				noteOnOffAddress: memoryAddressLookup[module.moduleId]['out:2'] / memoryBuffer.BYTES_PER_ELEMENT,
				velocityAddress: memoryAddressLookup[module.moduleId]['out:3'] / memoryBuffer.BYTES_PER_ELEMENT,
			};
		});
}
