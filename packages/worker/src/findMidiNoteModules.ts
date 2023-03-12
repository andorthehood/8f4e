import { CompiledModuleLookup } from '@8f4e/compiler';

import { MidiModuleAddresses } from './types';

export default function findMidiNoteModules(compiledModules: CompiledModuleLookup): MidiModuleAddresses[] {
	return Array.from(compiledModules)
		.map(([, compiledModule]) => compiledModule)
		.filter(({ id }) => id.startsWith('midi:'))
		.map(module => {
			return {
				moduleId: module.id,
				noteWordAddress: module.memoryMap.get('note')?.wordAddress,
				channelWordAddress: module.memoryMap.get('channel')?.wordAddress,
				noteOnOffWordAddress: module.memoryMap.get('trigger')?.wordAddress,
				velocityWordAddress: module.memoryMap.get('velocity')?.wordAddress,
			};
		});
}
