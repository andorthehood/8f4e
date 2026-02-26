import parseBinaryAssetLoads from './parseBinaryAssetLoads';

import { info } from '../../../logger/logger';

import type { StateManager } from '@8f4e/state-manager';
import type { State } from '~/types';

import resolveBinaryAssetTarget from '~/pureHelpers/resolveBinaryAssetTarget';

export default function binaryAssetLoading(store: StateManager<State>): void {
	const loadedTargets = new Set<string>();
	let previousReinitializedState = false;

	function resolveMemoryId(memoryRef: string, codeBlockId: string): string | undefined {
		if (!memoryRef.startsWith('&')) {
			return undefined;
		}

		const withoutPrefix = memoryRef.slice(1);
		if (withoutPrefix.length === 0) {
			return undefined;
		}

		if (withoutPrefix.includes('.')) {
			return withoutPrefix;
		}

		return `${codeBlockId}.${withoutPrefix}`;
	}

	async function loadBinaryFilesIntoMemory(): Promise<void> {
		const state = store.getState();
		if (!state.callbacks.loadBinaryAssetIntoMemory) {
			console.warn('Missing required callback: loadBinaryAssetIntoMemory');
			return;
		}

		const wasReinitializedNow = !previousReinitializedState && state.compiler.hasMemoryBeenReinitialized;
		previousReinitializedState = state.compiler.hasMemoryBeenReinitialized;
		if (wasReinitializedNow) {
			loadedTargets.clear();
		}

		const loads = parseBinaryAssetLoads(state.graphicHelper.codeBlocks);
		if (loads.length === 0) {
			return;
		}

		const assetsById = new Map(state.binaryAssets.map(asset => [asset.id, asset]));
		let hasWork = false;
		const requests = loads
			.map(loadDirective => {
				const baseAsset = assetsById.get(loadDirective.assetId);
				if (!baseAsset) {
					console.warn('Unknown @loadAsset id:', loadDirective.assetId);
					return null;
				}

				const memoryId = resolveMemoryId(loadDirective.memoryRef, loadDirective.codeBlockId);
				if (!memoryId) {
					console.warn('Invalid @loadAsset memoryRef (must use &memoryRef):', loadDirective.memoryRef);
					return null;
				}

				const targetKey = `${baseAsset.id}|${memoryId}`;
				if (loadedTargets.has(targetKey) && !state.compiler.hasMemoryBeenReinitialized) {
					return null;
				}
				hasWork = true;

				return {
					asset: { ...baseAsset, loadedIntoMemory: false, memoryId },
					targetKey,
				};
			})
			.filter((request): request is NonNullable<typeof request> => request !== null);

		if (!hasWork || requests.length === 0) {
			return;
		}

		info(state, 'Loading binary assets into memory...', 'BinaryAssets');

		for (const request of requests) {
			const resolved = resolveBinaryAssetTarget(state, request.asset.memoryId!);
			if (!resolved) {
				console.warn('Unable to resolve memory target:', request.asset.memoryId);
				continue;
			}

			try {
				request.asset.byteAddress = resolved.byteAddress;
				request.asset.memoryByteLength = resolved.memoryByteLength;
				await state.callbacks.loadBinaryAssetIntoMemory(request.asset);
				loadedTargets.add(request.targetKey);
			} catch (error) {
				console.error('Failed to load binary asset into memory:', request.asset.url, error);
			}
		}
	}

	store.subscribe('graphicHelper.codeBlocks', loadBinaryFilesIntoMemory);
	store.subscribe('graphicHelper.selectedCodeBlock.code', loadBinaryFilesIntoMemory);
	store.subscribe('graphicHelper.selectedCodeBlockForProgrammaticEdit.code', loadBinaryFilesIntoMemory);
	store.subscribe('binaryAssets', loadBinaryFilesIntoMemory);
	store.subscribe('compiler.hasMemoryBeenReinitialized', loadBinaryFilesIntoMemory);
}
