import type { CompiledModuleLookup, MemoryBuffer } from '@8f4e/compiler';
import type { MidiCCModuleAddresses } from './types';

export default function findMidiCCModules(
	compiledModules: CompiledModuleLookup,
	memoryBuffer: MemoryBuffer
): MidiCCModuleAddresses[] {
	return Object.values(compiledModules)
		.filter(({ id }) => id.startsWith('midiccout'))
		.map(module => {
			const value = module.memoryMap['value'];
			const channel = module.memoryMap['channel'];
			const cc = module.memoryMap['cc'];

			const valueWordAddress = value
				? value?.isPointer
					? memoryBuffer[value.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: value.wordAlignedAddress
				: undefined;

			const channelWordAddress = channel
				? channel?.isPointer
					? memoryBuffer[channel.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: channel.wordAlignedAddress
				: undefined;

			const selectedCCWordAddress = cc
				? cc?.isPointer
					? memoryBuffer[cc.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: cc.wordAlignedAddress
				: undefined;

			return {
				moduleId: module.id,
				valueWordAddress,
				channelWordAddress,
				selectedCCWordAddress,
			};
		});
}
