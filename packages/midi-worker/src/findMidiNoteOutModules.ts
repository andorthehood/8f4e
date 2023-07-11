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

			const noteWordAddress = note
				? note?.isPointer
					? memoryBuffer[note.wordAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: note.wordAddress
				: undefined;

			const channelWordAddress = channel
				? channel?.isPointer
					? memoryBuffer[channel.wordAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: channel.wordAddress
				: undefined;

			const noteOnOffWordAddress = noteOnOff
				? noteOnOff?.isPointer
					? memoryBuffer[noteOnOff.wordAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: noteOnOff.wordAddress
				: undefined;

			const velocityWordAddress = velocity
				? velocity?.isPointer
					? memoryBuffer[velocity.wordAddress] / memoryBuffer.BYTES_PER_ELEMENT
					: velocity.wordAddress
				: undefined;

			return {
				moduleId: module.id,
				noteWordAddress,
				channelWordAddress,
				noteOnOffWordAddress,
				velocityWordAddress,
			};
		});
}
