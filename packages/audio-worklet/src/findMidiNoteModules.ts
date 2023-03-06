import { CompiledModuleLookup, MemoryAddressLookup } from '@8f4e/compiler';

import { MidiModuleAddresses } from './types';

export default function findMidiNoteModules(
	compiledModules: CompiledModuleLookup,
	memoryAddressLookup: MemoryAddressLookup
): MidiModuleAddresses[] {
	return Array.from(compiledModules)
		.map(([, compiledModule]) => compiledModule)
		.filter(({ id }) => id.startsWith('midi:'))
		.map(module => {
			return {
				moduleId: module.id,
				noteAddress: memoryAddressLookup.get(module.id + 'note'),
				channelAddress: memoryAddressLookup.get(module.id + 'channel'),
				noteOnOffAddress: memoryAddressLookup.get(module.id + 'trigger'),
				velocityAddress: memoryAddressLookup.get(module.id + 'velocity'),
			};
		});
}
