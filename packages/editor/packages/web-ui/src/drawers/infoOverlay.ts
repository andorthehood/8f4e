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
	debugText.push('Compilation time: ' + state.compiler.compilationTime.toFixed(2) + 'ms');
	debugText.push('WASM byte code size: ' + formatBytes(state.compiler.byteCodeSize));

	if (state.compiler.allocatedMemoryBytes > 0) {
		debugText.push(
			'Memory usage: ' +
				formatBytes(state.compiler.requiredMemoryBytes) +
				' / ' +
				formatBytes(state.compiler.allocatedMemoryBytes) +
				' (' +
				Math.round((state.compiler.requiredMemoryBytes / state.compiler.allocatedMemoryBytes) * 100) +
				'%)'
		);
		debugText.push('Allocated pages: ' + state.compiler.allocatedMemoryBytes / 65536);
	}

	// Runtime stats

	const selectedRuntimeId = state.editorConfig.runtime ?? state.defaultRuntimeId;

	debugText.push('');
	debugText.push('Runtime: ' + selectedRuntimeId);

	if (state.runtime.stats.timerExpectedIntervalTimeMs) {
		debugText.push('Loop interval: ' + state.runtime.stats.timerExpectedIntervalTimeMs + ' ms');
		debugText.push('Loop time: ' + state.runtime.stats.timeToExecuteLoopMs.toFixed(2) + 'ms');
		debugText.push('Timer accuracy: ' + state.runtime.stats.timerPrecisionPercentage.toFixed(2) + '%');
		debugText.push('Timer drift: ' + state.runtime.stats.timerDriftMs.toFixed(2) + 'ms');
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
