import { CompiledModule, MemoryAddressLookup, MemoryBuffer } from '../../compiler/src';
import { MidiCCModuleAddresses } from './types';

export default function findMidiNoteModules(
	compiledModules: CompiledModule[],
	memoryBuffer: MemoryBuffer,
	memoryAddressLookup: MemoryAddressLookup
): MidiCCModuleAddresses[] {
	return compiledModules
		.filter(({ moduleId }) => moduleId.startsWith('cvToMidiCC'))
		.map(module => {
			return {
				moduleId: module.moduleId,
				valueAddress: memoryAddressLookup[module.moduleId]['out:1'],
				channelAddress: memoryAddressLookup[module.moduleId]['data:1'],
				selectedCCAddress: memoryAddressLookup[module.moduleId]['data:2'],
			};
		});
}
