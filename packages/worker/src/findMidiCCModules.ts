import { CompiledModuleLookup, MemoryBuffer } from '@8f4e/compiler';

import { MidiCCModuleAddresses } from './types';

export default function findMidiCCModules(
	compiledModules: CompiledModuleLookup,
	memoryBuffer: MemoryBuffer
): MidiCCModuleAddresses[] {
	return Array.from(compiledModules)
		.map(([, compiledModule]) => compiledModule)
		.filter(({ id }) => id.startsWith('midicc:'))
		.map(module => {
			const value = module.memoryMap.get('value');
			const channel = module.memoryMap.get('channel');
			const cc = module.memoryMap.get('cc');

			const valueWordAddress = value
				? value?.isPointer
					? memoryBuffer[value.wordAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: value.wordAddress
				: undefined;

			const channelWordAddress = channel
				? channel?.isPointer
					? memoryBuffer[channel.wordAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: channel.wordAddress
				: undefined;

			const selectedCCWordAddress = cc
				? cc?.isPointer
					? memoryBuffer[cc.wordAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: cc.wordAddress
				: undefined;

			return {
				moduleId: module.id,
				valueWordAddress,
				channelWordAddress,
				selectedCCWordAddress,
			};
		});
}
