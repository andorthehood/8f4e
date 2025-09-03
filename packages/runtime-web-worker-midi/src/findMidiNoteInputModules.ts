import { CompiledModuleLookup, MemoryBuffer } from '@8f4e/compiler';

import type { MidiCCModuleAddresses } from './types';

export default function findMidCCInputModules(
	compiledModules: CompiledModuleLookup,
	memoryBuffer: MemoryBuffer
): Map<string, MidiCCModuleAddresses> {
	return new Map(
		Array.from(compiledModules)
			.map(([, compiledModule]) => compiledModule)
			.filter(
				({ id, memoryMap }) =>
					id.startsWith('midiccin') && memoryMap.has('channel') && memoryMap.has('cc') && memoryMap.has('channel')
			)
			.map(module => {
				const channel = module.memoryMap.get('channel');
				const cc = module.memoryMap.get('cc');
				const value = module.memoryMap.get('value');

				return [
					memoryBuffer[channel?.wordAlignedAddress || 0] + '' + memoryBuffer[cc?.wordAlignedAddress || 0],
					{
						moduleId: module.id,
						valueWordAddress: value?.wordAlignedAddress,
						channelWordAddress: channel?.wordAlignedAddress,
						selectedCCWordAddress: cc?.wordAlignedAddress,
					},
				];
			})
	);
}
