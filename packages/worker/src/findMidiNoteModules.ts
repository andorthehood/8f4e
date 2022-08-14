import { CompiledModule, MemoryAddressLookup, MemoryBuffer } from '@8f4e/synth-compiler';
import { MidiModuleAddresses } from './types';

export default function findMidiNoteModules(
	compiledModules: CompiledModule[],
	memoryBuffer: MemoryBuffer,
	memoryAddressLookup: MemoryAddressLookup
): MidiModuleAddresses[] {
	return compiledModules
		.filter(({ moduleId }) => moduleId.startsWith('cvToMidiNote'))
		.map(module => {
			return {
				moduleId: module.moduleId,
				noteAddress: memoryAddressLookup[module.moduleId]['out:1'],
				channelAddress: memoryAddressLookup[module.moduleId]['data:1'],
				noteOnOffAddress: memoryAddressLookup[module.moduleId]['out:2'],
				velocityAddress: memoryAddressLookup[module.moduleId]['out:3'],
			};
		});
}
