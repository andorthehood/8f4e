import { Engine } from 'glugglug';

const GLOBAL_ALIGNMENT_BOUNDARY = 4;

import type { State } from '@8f4e/editor-state';

function formatBytes(bytes: number): string {
	if (bytes < 1000) {
		return bytes + ' bytes';
	} else if (bytes < 1000000) {
		return (bytes / 1000).toFixed(2) + ' KB';
	} else {
		return (bytes / 1000000).toFixed(2) + ' MB';
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
		debugText.push('');
	}

	// Runtime info
	const runtime = state.compiler.runtimeSettings[state.compiler.selectedRuntime];

	debugText.push('Runtime: ' + runtime.runtime);
	debugText.push('Sample rate: ' + runtime.sampleRate);

	if (runtime.runtime === 'AudioWorkletRuntime' && runtime.audioInputBuffers) {
		runtime.audioInputBuffers.forEach(({ moduleId, memoryId, channel, input }) => {
			debugText.push(
				'- Audio Input ' + input + ': Channel: ' + channel + ' Module: ' + moduleId + ' Buffer: ' + memoryId
			);
		});
	}

	if (runtime.runtime === 'AudioWorkletRuntime' && runtime.audioOutputBuffers) {
		runtime.audioOutputBuffers.forEach(({ moduleId, memoryId, channel, output }) => {
			debugText.push(
				'- Audio Output ' + output + ': Channel: ' + channel + ' Module: ' + moduleId + ' Buffer: ' + memoryId
			);
		});
	}

	// Graphic info
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
	debugText.push('');

	// Compiler info
	debugText.push(
		'Compilation time ' +
			state.compiler.compilationTime.toFixed(2) +
			'ms  Cycle time:' +
			state.compiler.cycleTime +
			'ms  Timer accuracy: ' +
			state.compiler.timerAccuracy +
			'%'
	);
	debugText.push('WASM byte code size: ' + formatBytes(state.compiler.codeBuffer.length));
	debugText.push(
		'Allocated memory: ' +
			formatBytes(state.compiler.allocatedMemorySize) +
			' / ' +
			formatBytes(state.compiler.compilerOptions.memorySizeBytes) +
			' (' +
			Math.round((state.compiler.allocatedMemorySize / state.compiler.compilerOptions.memorySizeBytes) * 100) +
			'%)'
	);

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

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
		engine.drawText(state.graphicHelper.viewport.vGrid, i * state.graphicHelper.viewport.hGrid, debugText[i]);
	}

	engine.endGroup();
}
