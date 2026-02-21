import eventCodeToUsbHidUsageId from './eventCodeToUsbHidUsageId';

import type { StateManager } from '@8f4e/state-manager';
import type { State } from '@8f4e/editor-state';

function resolveWordAlignedAddress(state: State, memoryId?: string): number | undefined {
	if (!memoryId) {
		return undefined;
	}

	const separatorIndex = memoryId.indexOf('.');
	if (separatorIndex <= 0 || separatorIndex >= memoryId.length - 1) {
		return undefined;
	}

	const moduleId = memoryId.slice(0, separatorIndex);
	const memoryName = memoryId.slice(separatorIndex + 1);
	const compiledModule = state.compiler.compiledModules[moduleId];
	return compiledModule?.memoryMap[memoryName]?.wordAlignedAddress;
}

function writeIntegerToMemory(state: State, wordAlignedAddress: number | undefined, value: number): void {
	if (wordAlignedAddress === undefined) {
		return;
	}
	state.callbacks.setWordInMemory?.(wordAlignedAddress, value, true);
}

export default function keyboardMemoryEvents(store: StateManager<State>): () => void {
	const pressOrder: number[] = [];

	function upsertPressedKeyCode(keyCode: number): void {
		const existingIndex = pressOrder.indexOf(keyCode);
		if (existingIndex !== -1) {
			pressOrder.splice(existingIndex, 1);
		}
		pressOrder.push(keyCode);
	}

	function removePressedKeyCode(keyCode: number): void {
		const existingIndex = pressOrder.indexOf(keyCode);
		if (existingIndex !== -1) {
			pressOrder.splice(existingIndex, 1);
		}
	}

	function getLatestPressedKeyCode(): number | undefined {
		return pressOrder[pressOrder.length - 1];
	}

	function onKeydown(event: KeyboardEvent): void {
		const hidUsageId = eventCodeToUsbHidUsageId(event.code) ?? 0;
		upsertPressedKeyCode(hidUsageId);

		const state = store.getState();
		const keyCodeWordAlignedAddress = resolveWordAlignedAddress(state, state.compiledProjectConfig.keyCodeMemoryId);
		const keyPressedWordAlignedAddress = resolveWordAlignedAddress(
			state,
			state.compiledProjectConfig.keyPressedMemoryId
		);

		writeIntegerToMemory(state, keyCodeWordAlignedAddress, hidUsageId);
		writeIntegerToMemory(state, keyPressedWordAlignedAddress, 1);
	}

	function onKeyup(event: KeyboardEvent): void {
		const hidUsageId = eventCodeToUsbHidUsageId(event.code) ?? 0;
		removePressedKeyCode(hidUsageId);

		const state = store.getState();
		const keyCodeWordAlignedAddress = resolveWordAlignedAddress(state, state.compiledProjectConfig.keyCodeMemoryId);
		const keyPressedWordAlignedAddress = resolveWordAlignedAddress(
			state,
			state.compiledProjectConfig.keyPressedMemoryId
		);

		const latestPressedKeyCode = getLatestPressedKeyCode();
		if (latestPressedKeyCode === undefined) {
			writeIntegerToMemory(state, keyPressedWordAlignedAddress, 0);
			return;
		}

		writeIntegerToMemory(state, keyCodeWordAlignedAddress, latestPressedKeyCode);
		writeIntegerToMemory(state, keyPressedWordAlignedAddress, 1);
	}

	function onBlur(): void {
		pressOrder.length = 0;

		const state = store.getState();
		const keyPressedWordAlignedAddress = resolveWordAlignedAddress(
			state,
			state.compiledProjectConfig.keyPressedMemoryId
		);
		writeIntegerToMemory(state, keyPressedWordAlignedAddress, 0);
	}

	window.addEventListener('keydown', onKeydown);
	window.addEventListener('keyup', onKeyup);
	window.addEventListener('blur', onBlur);

	return () => {
		window.removeEventListener('keydown', onKeydown);
		window.removeEventListener('keyup', onKeyup);
		window.removeEventListener('blur', onBlur);
	};
}
