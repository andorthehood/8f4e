import type { CompiledModuleLookup, MemoryBuffer } from '@8f4e/compiler';
import type { MidiCCModuleAddresses } from './types';

export default function findMidCCInputModules(
	compiledModules: CompiledModuleLookup,
	memoryBuffer: MemoryBuffer
): Map<string, MidiCCModuleAddresses> {
	return new Map(
		Object.values(compiledModules)
			.filter(
				({ id, memoryMap }) =>
					id.startsWith('midiccin') && Object.hasOwn(memoryMap, 'channel') && Object.hasOwn(memoryMap, 'cc')
			)
			.map(module => {
				const value = module.memoryMap['value'];
				const channel = module.memoryMap['channel'];
				const cc = module.memoryMap['cc'];

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
