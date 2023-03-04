import { CompiledModuleLookup, MemoryAddressLookup } from '@8f4e/compiler';

import { MidiCCModuleAddresses } from './types';

export default function findMidiNoteModules(
	compiledModules: CompiledModuleLookup,
	memoryAddressLookup: MemoryAddressLookup
): MidiCCModuleAddresses[] {
	return Array.from(compiledModules)
		.map(([, compiledModule]) => compiledModule)
		.filter(({ id }) => id.startsWith('cvToMidiCC'))
		.map(module => {
			return {
				moduleId: module.id,
				valueAddress: memoryAddressLookup.get(module.id + 'out:1'),
				channelAddress: memoryAddressLookup.get(module.id + 'data:1'),
				selectedCCAddress: memoryAddressLookup.get(module.id + 'data:2'),
			};
		});
}
