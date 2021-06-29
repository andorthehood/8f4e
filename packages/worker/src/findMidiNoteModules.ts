import { CompiledModule, MemoryBuffer } from '../../compiler/src';
import { MidiModuleAddresses } from './types';

export default function findMidiNoteModules(
	compiledModules: CompiledModule[],
	memoryBuffer: MemoryBuffer
): MidiModuleAddresses[] {
	return compiledModules
		.filter(({ moduleId }) => moduleId.startsWith('cvToMidi'))
		.map(module => {
			return {
				noteAddress: module.memoryAddresses.find(({ id }) => id === 'out:1').address / memoryBuffer.BYTES_PER_ELEMENT,
				channelAddress:
					module.memoryAddresses.find(({ id }) => id === 'data:1').address / memoryBuffer.BYTES_PER_ELEMENT,
				noteOnOffAddress:
					module.memoryAddresses.find(({ id }) => id === 'out:2').address / memoryBuffer.BYTES_PER_ELEMENT,
				velocityAddress:
					module.memoryAddresses.find(({ id }) => id === 'out:3').address / memoryBuffer.BYTES_PER_ELEMENT,
			};
		});
}
