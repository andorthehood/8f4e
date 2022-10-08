import { CompiledModule, MemoryAddressLookup, MemoryBuffer } from '@8f4e/compiler';

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
				noteAddress: memoryAddressLookup.get(module.moduleId + 'out:1'),
				channelAddress: memoryAddressLookup.get(module.moduleId + 'data:1'),
				noteOnOffAddress: memoryAddressLookup.get(module.moduleId + 'out:2'),
				velocityAddress: memoryAddressLookup.get(module.moduleId + 'out:3'),
			};
		});
}
