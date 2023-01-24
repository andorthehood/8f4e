import { CompiledModuleLookup, MemoryAddressLookup, MemoryBuffer } from '@8f4e/compiler';

import { MidiCCModuleAddresses } from './types';

export default function findMidiNoteModules(
	compiledModules: CompiledModuleLookup,
	memoryBuffer: MemoryBuffer,
	memoryAddressLookup: MemoryAddressLookup
): MidiCCModuleAddresses[] {
	return Array.from(compiledModules)
		.map(([, compiledModule]) => compiledModule)
		.filter(({ moduleId }) => moduleId.startsWith('cvToMidiCC'))
		.map(module => {
			return {
				moduleId: module.moduleId,
				valueAddress: memoryAddressLookup.get(module.moduleId + 'out:1'),
				channelAddress: memoryAddressLookup.get(module.moduleId + 'data:1'),
				selectedCCAddress: memoryAddressLookup.get(module.moduleId + 'data:2'),
			};
		});
}
