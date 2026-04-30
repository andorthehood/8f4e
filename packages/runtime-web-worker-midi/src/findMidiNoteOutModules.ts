import type { CompiledModuleLookup, MemoryBuffer } from '@8f4e/compiler-types';
import type { MidiModuleAddresses } from './types';

export default function findMidiNoteOutModules(
	compiledModules: CompiledModuleLookup,
	memoryBuffer: MemoryBuffer
): MidiModuleAddresses[] {
	return Object.values(compiledModules)
		.filter(({ id }) => id.startsWith('midinoteout'))
		.map(module => {
			const note = module.memoryMap['note'];
			const channel = module.memoryMap['channel'];
			const noteOnOff = module.memoryMap['gate'];
			const velocity = module.memoryMap['velocity'];
			const port = module.memoryMap['port'];

			const noteWordAddress = note
				? note?.pointeeBaseType
					? memoryBuffer[note.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: note.wordAlignedAddress
				: undefined;

			const channelWordAddress = channel
				? channel?.pointeeBaseType
					? memoryBuffer[channel.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: channel.wordAlignedAddress
				: undefined;

			const noteOnOffWordAddress = noteOnOff
				? noteOnOff?.pointeeBaseType
					? memoryBuffer[noteOnOff.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: noteOnOff.wordAlignedAddress
				: undefined;

			const velocityWordAddress = velocity
				? velocity?.pointeeBaseType
					? memoryBuffer[velocity.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: velocity.wordAlignedAddress
				: undefined;

			const portWordAddress = port
				? port?.pointeeBaseType
					? memoryBuffer[port.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: port.wordAlignedAddress
				: undefined;

			return {
				channelWordAddress,
				moduleId: module.id,
				noteOnOffWordAddress,
				noteWordAddress,
				portWordAddress,
				velocityWordAddress,
			};
		});
}
