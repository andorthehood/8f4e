import { CompiledModuleLookup } from '@8f4e/compiler';

import { MidiCCModuleAddresses } from './types';

export default function findMidiNoteModules(compiledModules: CompiledModuleLookup): MidiCCModuleAddresses[] {
	return Array.from(compiledModules)
		.map(([, compiledModule]) => compiledModule)
		.filter(({ id }) => id.startsWith('cvToMidiCC'))
		.map(module => {
			return {
				moduleId: module.id,
				valueWordAddress: module.memoryMap.get('value')?.wordAddress,
				channelWordAddress: module.memoryMap.get('channel')?.wordAddress,
				selectedCCWordAddress: module.memoryMap.get('cc')?.wordAddress,
			};
		});
}
