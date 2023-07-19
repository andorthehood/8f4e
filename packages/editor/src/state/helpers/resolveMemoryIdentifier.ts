import { MemoryItem } from '@8f4e/compiler';

import { Output, State } from '../types';

export default function resolveMemoryIdentifier(state: State, moduleId: string, memoryIdentifier: string) {
	let memory: MemoryItem | Output | undefined;
	let showAddress = false;
	let operator: '&' | '*' | undefined;

	if (memoryIdentifier.startsWith('&')) {
		operator = '&';
		showAddress = true;
		memoryIdentifier = memoryIdentifier.substring(1);
	}

	if (memoryIdentifier.startsWith('*')) {
		operator = '*';
		memoryIdentifier = memoryIdentifier.substring(1);
	}

	if (/(\S+)\.(\S+)/.test(memoryIdentifier)) {
		moduleId = memoryIdentifier.split('.')[0];
		memoryIdentifier = memoryIdentifier.split('.')[1];
	}

	memory = state.compiler.compiledModules.get(moduleId)?.memoryMap.get(memoryIdentifier);

	if (!memory) {
		return null;
	}

	if (operator === '*' && memory.isPointer) {
		memory = state.graphicHelper.outputsByWordAddress.get(state.compiler.memoryBuffer[memory.wordAddress]);
	}

	if (!memory) {
		return null;
	}

	return {
		wordAddress: memory.wordAddress,
		showAddress,
		isInteger: memory.isInteger,
	};
}
