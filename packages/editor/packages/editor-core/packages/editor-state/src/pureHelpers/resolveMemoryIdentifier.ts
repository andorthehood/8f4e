import type { MemoryIdentifier, State } from '@8f4e/editor-state-types';
import type { PlannedMemoryDeclaration } from '@8f4e/language-spec';
import resolveMemoryTarget, { type MemoryScope, type ResolvedMemoryTarget } from './resolveMemoryTarget';

export default function resolveMemoryIdentifier(
	state: State,
	scope: MemoryScope,
	memoryIdentifier: string | undefined
): (MemoryIdentifier & { target: ResolvedMemoryTarget }) | undefined {
	if (!memoryIdentifier) {
		return;
	}

	let showAddress = false;
	let showEndAddress = false;
	let operator: '&' | '*' | undefined;
	let bufferPointer = 0;
	let displayFormat: 'decimal' | 'binary' | 'hex' = 'decimal';

	if (memoryIdentifier.startsWith('0b')) {
		displayFormat = 'binary';
		memoryIdentifier = memoryIdentifier.substring(2);
	} else if (memoryIdentifier.startsWith('0x')) {
		displayFormat = 'hex';
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

	if (/.+\[(\d+)\]/.test(memoryIdentifier)) {
		const match = memoryIdentifier.match(/.+\[(\d+)\]/) as [never, string];
		bufferPointer = parseInt(match[1], 10);
		memoryIdentifier = memoryIdentifier.replace(/\[\d+\]/, '');
	}

	const target = resolveMemoryTarget(state, scope, memoryIdentifier);
	if (!target) return;
	let memory: PlannedMemoryDeclaration | undefined = target.memory;
	if (operator === '*' && memory.pointeeBaseType) {
		const pointerAddress = state.callbacks?.getWordFromMemory?.(memory.allocationUnitAddress) || 0;
		memory = state.compiler.memoryPlan.moduleList
			.flatMap(module => module.declarations)
			.find(declaration => declaration.byteAddress === pointerAddress);
	}

	if (!memory) {
		return;
	}

	return {
		target,
		showAddress,
		showEndAddress,
		memory,
		bufferPointer,
		displayFormat,
	};
}
