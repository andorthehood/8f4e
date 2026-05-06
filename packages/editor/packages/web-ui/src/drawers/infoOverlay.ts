import { Engine } from 'glugglug';

const GLOBAL_ALIGNMENT_BOUNDARY = 4;

import type { State } from '@8f4e/editor-state-types';

function formatBytes(bytes: number): string {
	if (bytes < 1000) {
		return bytes + ' bytes';
	} else if (bytes < 1000000) {
		return (bytes / 1000).toFixed(2) + ' KB';
	} else if (bytes < 1000000000) {
		return (bytes / 1000000).toFixed(2) + ' MB';
	} else {
		return (bytes / 1000000000).toFixed(2) + ' GB';
	}
}

function getCompilerInfoNumber(state: State, key: string): number {
	const value = state.info.compiler?.[key];
	return typeof value === 'number' ? value : 0;
}

function getRuntimeInfoNumber(state: State, key: string): number {
	const value = state.info.runtime?.[key];
	return typeof value === 'number' ? value : 0;
}

export default function drawInfoOverlay(
	engine: Engine,
	state: State,
	{
		timeToRender,
		fps,
		vertices,
		maxVertices,
	}: { timeToRender: number; fps: number; vertices: number; maxVertices: number }
): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	const debugText: string[] = [];

	const selectedModule =
		state.graphicHelper.selectedCodeBlock && state.graphicHelper.selectedCodeBlock.moduleId
			? state.compiler.compiledModules[state.graphicHelper.selectedCodeBlock.moduleId]
			: undefined;

	if (selectedModule) {
		debugText.push('Selected module: ' + selectedModule.id);
		debugText.push('Memory footprint: ' + formatBytes(selectedModule.wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY));
		debugText.push('Memory address: ' + selectedModule.byteAddress + ' (nth byte)');
		debugText.push('Index: ' + selectedModule.index);
	}

	// Graphic stats
	debugText.push('');
	debugText.push('Quad count: ' + vertices / 6);
	debugText.push(
		'Vertex buffer: ' + vertices + '/' + maxVertices + ' (' + Math.round((vertices / maxVertices) * 100) + '%)'
	);
	debugText.push('Time to render one frame ' + timeToRender.toFixed(2) + 'ms');
	debugText.push('FPS: ' + fps);
	debugText.push('Graphic load: ' + ((timeToRender / (1000 / fps)) * 100).toFixed(2) + '%');
	const cs = engine.getCacheStats();
	debugText.push('Cached items: ' + cs.itemCount + '/' + cs.maxItems);

	// Compiler stats
	debugText.push('');
	const compilationTimeMs = getCompilerInfoNumber(state, 'compilationTimeMs');
	const wasmByteCodeBytes = getCompilerInfoNumber(state, 'wasmByteCodeBytes');
	const requiredMemoryBytes = getCompilerInfoNumber(state, 'requiredMemoryBytes');
	const allocatedMemoryBytes = getCompilerInfoNumber(state, 'allocatedMemoryBytes');
	const memoryUsagePercent = getCompilerInfoNumber(state, 'memoryUsagePercent');

	debugText.push('Compilation time: ' + compilationTimeMs.toFixed(2) + 'ms');
	debugText.push('WASM byte code size: ' + formatBytes(wasmByteCodeBytes));

	if (allocatedMemoryBytes > 0) {
		debugText.push(
			'Memory usage: ' +
				formatBytes(requiredMemoryBytes) +
				' / ' +
				formatBytes(allocatedMemoryBytes) +
				' (' +
				memoryUsagePercent +
				'%)'
		);
		debugText.push('Allocated pages: ' + allocatedMemoryBytes / 65536);
	}

	// Runtime stats

	const selectedRuntimeId = state.editorConfig.runtime ?? state.defaultRuntimeId;

	debugText.push('');
	debugText.push('Runtime: ' + selectedRuntimeId);

	const timerExpectedIntervalTimeMs = getRuntimeInfoNumber(state, 'timerExpectedIntervalTimeMs');
	if (timerExpectedIntervalTimeMs) {
		debugText.push('Loop interval: ' + timerExpectedIntervalTimeMs + ' ms');
		debugText.push('Loop time: ' + getRuntimeInfoNumber(state, 'timeToExecuteLoopMs').toFixed(2) + 'ms');
		debugText.push('Timer accuracy: ' + getRuntimeInfoNumber(state, 'timerPrecisionPercentage').toFixed(2) + '%');
		debugText.push('Timer drift: ' + getRuntimeInfoNumber(state, 'timerDriftMs').toFixed(2) + 'ms');
	}

	if (state.storageQuota.usedBytes > 0 && state.storageQuota.totalBytes > 0) {
		debugText.push('');
		debugText.push(
			'Storage usage: ' +
				formatBytes(state.storageQuota.usedBytes) +
				' / ' +
				formatBytes(state.storageQuota.totalBytes) +
				' (' +
				Math.round((state.storageQuota.usedBytes / state.storageQuota.totalBytes) * 100) +
				'%)'
		);
	}

	engine.startGroup(0, state.viewport.roundedHeight - state.viewport.hGrid * (debugText.length + 1));

	for (let i = 0; i < debugText.length; i++) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
		engine.drawSprite(
			0,
			i * state.viewport.hGrid,
			'debugInfoBackground',
			(debugText[i].length + 2) * state.viewport.vGrid,
			state.viewport.hGrid
		);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontDebugInfo);
		engine.drawText(state.viewport.vGrid, i * state.viewport.hGrid, debugText[i]);
	}

	engine.endGroup();
}
