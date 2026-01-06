import { Engine } from 'glugglug';

const GLOBAL_ALIGNMENT_BOUNDARY = 4;

import type { State } from '@8f4e/editor-state';

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

	const selectedModule = state.graphicHelper.selectedCodeBlock
		? state.compiler.compiledModules[state.graphicHelper.selectedCodeBlock.id]
		: undefined;

	if (selectedModule) {
		debugText.push('Selected module: ' + selectedModule.id);
		debugText.push('Memory footprint: ' + formatBytes(selectedModule.wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY));
		debugText.push('Memory address: ' + selectedModule.byteAddress + ' (nth byte)');
		debugText.push('Index: ' + selectedModule.index);
	}

	const runtime = state.runtime.runtimeSettings[state.runtime.selectedRuntime];

	if (runtime.runtime === 'AudioWorkletRuntime' && Array.isArray(runtime.audioInputBuffers)) {
		runtime.audioInputBuffers.forEach(({ memoryId, channel, input }) => {
			debugText.push('- Audio Input ' + input + ': Channel: ' + channel + ' Buffer: ' + memoryId);
		});
	}

	if (runtime.runtime === 'AudioWorkletRuntime' && Array.isArray(runtime.audioOutputBuffers)) {
		runtime.audioOutputBuffers.forEach(({ memoryId, channel, output }) => {
			debugText.push('- Audio Output ' + output + ': Channel: ' + channel + ' Buffer: ' + memoryId);
		});
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
	debugText.push('WASM byte code size: ' + formatBytes(state.compiler.codeBuffer.length));

	if (state.compiledConfig?.memorySizeBytes) {
		debugText.push(
			'Allocated memory: ' +
				formatBytes(state.compiler.allocatedMemorySize) +
				' / ' +
				formatBytes(state.compiledConfig.memorySizeBytes) +
				' (' +
				Math.round((state.compiler.allocatedMemorySize / state.compiledConfig.memorySizeBytes) * 100) +
				'%)'
		);
	}

	// Runtime stats
	debugText.push('');
	debugText.push('Runtime: ' + runtime.runtime);

	if (state.runtime.stats.timerExpectedIntervalTimeMs) {
		debugText.push(
			'Sample rate: ' + runtime.sampleRate + ' Hz (' + state.runtime.stats.timerExpectedIntervalTimeMs + ' ms interval)'
		);
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

	engine.startGroup(
		0,
		state.graphicHelper.viewport.roundedHeight - state.graphicHelper.viewport.hGrid * (debugText.length + 1)
	);

	for (let i = 0; i < debugText.length; i++) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
		engine.drawSprite(
			0,
			i * state.graphicHelper.viewport.hGrid,
			'moduleBackground',
			(debugText[i].length + 2) * state.graphicHelper.viewport.vGrid,
			state.graphicHelper.viewport.hGrid
		);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontLineNumber);
		engine.drawText(state.graphicHelper.viewport.vGrid, i * state.graphicHelper.viewport.hGrid, debugText[i]);
	}

	engine.endGroup();
}
