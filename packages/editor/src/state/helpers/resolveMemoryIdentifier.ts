import { MemoryItem } from '@8f4e/compiler';

import { State } from '../types';

export default function resolveMemoryIdentifier(state: State, moduleId: string, memoryIdentifier: string) {
	let memory: MemoryItem | undefined;
	let showAddress = false;
	let showEndAddress = false;
	let operator: '&' | '*' | undefined;

	if (memoryIdentifier.endsWith('&')) {
		operator = '&';
		showEndAddress = true;
		memoryIdentifier = memoryIdentifier.slice(0, -1);
	}

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
		memory = state.graphicHelper.outputsByWordAddress.get(state.compiler.memoryBuffer[memory.wordAddress])?.memory;
	}

	if (!memory) {
		return null;
	}

	return {
		showAddress,
		showEndAddress,
		memory,
	};
}
