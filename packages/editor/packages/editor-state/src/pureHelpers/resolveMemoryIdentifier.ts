import type { MemoryIdentifier, State } from '../types';
import type { DataStructure } from '@8f4e/compiler';

export default function resolveMemoryIdentifier(
	state: State,
	moduleId: string,
	memoryIdentifier: string | undefined
): MemoryIdentifier | undefined {
	if (!memoryIdentifier) {
		return;
	}

	let memory: DataStructure | undefined;
	let showAddress = false;
	let showEndAddress = false;
	let operator: '&' | '*' | undefined;
	let bufferPointer = 0;
	let showBinary = false;

	if (memoryIdentifier.startsWith('0b')) {
		showBinary = true;
		memoryIdentifier = memoryIdentifier.substring(2);
	}

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

	if (/.+\[(\d+)\]/.test(memoryIdentifier)) {
		const match = memoryIdentifier.match(/.+\[(\d+)\]/) as [never, string];
		bufferPointer = parseInt(match[1], 10);
		memoryIdentifier = memoryIdentifier.replace(/\[\d+\]/, '');
	}

	memory = state.compiler.compiledModules[moduleId]?.memoryMap[memoryIdentifier];

	if (!memory) {
		return;
	}

	if (operator === '*' && memory.isPointer) {
		memory = state.graphicHelper.outputsByWordAddress.get(
			state.callbacks?.getWordFromMemory?.(memory.wordAlignedAddress) || 0
		)?.memory;
	}

	if (!memory) {
		return;
	}

	return {
		showAddress,
		showEndAddress,
		memory,
		bufferPointer,
		showBinary,
	};
}
