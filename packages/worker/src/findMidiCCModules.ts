import { CompiledModule, MemoryBuffer } from '../../compiler/src';
import { MidiCCModuleAddresses } from './types';

export default function findMidiNoteModules(
	compiledModules: CompiledModule[],
	memoryBuffer: MemoryBuffer
): MidiCCModuleAddresses[] {
	return compiledModules
		.filter(({ moduleId }) => moduleId.startsWith('cvToMidiCC'))
		.map(module => {
			return {
				moduleId: module.moduleId,
				valueAddress: module.memoryAddresses.find(({ id }) => id === 'out:1').address / memoryBuffer.BYTES_PER_ELEMENT,
				channelAddress:
					module.memoryAddresses.find(({ id }) => id === 'data:1').address / memoryBuffer.BYTES_PER_ELEMENT,
				selectedCCAddress:
					module.memoryAddresses.find(({ id }) => id === 'data:2').address / memoryBuffer.BYTES_PER_ELEMENT,
			};
		});
}
