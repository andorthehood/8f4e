import { CompiledModuleLookup, MemoryBuffer } from '@8f4e/compiler';

import { MidiModuleAddresses } from './types';

export default function findMidiNoteOutModules(
	compiledModules: CompiledModuleLookup,
	memoryBuffer: MemoryBuffer
): MidiModuleAddresses[] {
	return Array.from(compiledModules)
		.map(([, compiledModule]) => compiledModule)
		.filter(({ id }) => id.startsWith('midinoteout'))
		.map(module => {
			const note = module.memoryMap.get('note');
			const channel = module.memoryMap.get('channel');
			const noteOnOff = module.memoryMap.get('gate');
			const velocity = module.memoryMap.get('velocity');
			const port = module.memoryMap.get('port');

			const noteWordAddress = note
				? note?.isPointer
					? memoryBuffer[note.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: note.wordAlignedAddress
				: undefined;

			const channelWordAddress = channel
				? channel?.isPointer
					? memoryBuffer[channel.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: channel.wordAlignedAddress
				: undefined;

			const noteOnOffWordAddress = noteOnOff
				? noteOnOff?.isPointer
					? memoryBuffer[noteOnOff.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: noteOnOff.wordAlignedAddress
				: undefined;

			const velocityWordAddress = velocity
				? velocity?.isPointer
					? memoryBuffer[velocity.wordAlignedAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: velocity.wordAlignedAddress
				: undefined;

			const portWordAddress = port
				? port?.isPointer
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
