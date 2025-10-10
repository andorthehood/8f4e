import { CompiledModuleLookup, MemoryBuffer } from '@8f4e/compiler';

import type { MidiCCModuleAddresses } from './types';

export default function findMidCCInputModules(
	compiledModules: CompiledModuleLookup,
	memoryBuffer: MemoryBuffer
): Map<string, MidiCCModuleAddresses> {
	return new Map(
		Object.values(compiledModules)
			.filter(
				({ id, memoryMap }) =>
					id.startsWith('midiccin') && 'channel' in memoryMap && 'cc' in memoryMap && 'channel' in memoryMap
			)
			.map(module => {
				const channel = module.memoryMap['channel'];
				const cc = module.memoryMap['cc'];
				const value = module.memoryMap['value'];

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
