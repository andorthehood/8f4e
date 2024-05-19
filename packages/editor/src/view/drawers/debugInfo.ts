import { Engine } from '@8f4e/2d-engine';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '@8f4e/compiler/dist/consts';

import { State } from '../../state/types';

function formatBytes(bytes: number): string {
	if (bytes < 1000) {
		return bytes + ' bytes';
	} else if (bytes < 1000000) {
		return (bytes / 1000).toFixed(2) + ' KB';
	} else {
		return (bytes / 1000000).toFixed(2) + ' MB';
	}
}

export default function drawDebugInfo(
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
		? state.compiler.compiledModules.get(state.graphicHelper.selectedCodeBlock.id)
		: undefined;

	if (selectedModule) {
		debugText.push('Selected module: ' + selectedModule.id);
		debugText.push('Memory footrpint: ' + formatBytes(selectedModule.wordAlignedSize * GLOBAL_ALIGNMENT_BOUNDARY));
		debugText.push('Memory address: ' + selectedModule.byteAddress);
		debugText.push('Index: ' + selectedModule.index);
		debugText.push('');
	}

	debugText.push('Sample rate: ' + state.project.sampleRate);
	debugText.push('Vertex buffer: ' + Math.round((vertices / maxVertices) * 100) + '%');
	debugText.push('Graphic load: ' + ((timeToRender / (1000 / 120)) * 100).toFixed(2) + '%');
	debugText.push('Time to render one frame ' + timeToRender.toFixed(2) + 'ms');
	debugText.push('FPS: ' + fps + '  Vertex buffer: ' + vertices + '/' + maxVertices);

	debugText.push('');

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
	debugText.push('Allocated memory: ' + formatBytes(state.compiler.allocatedMemorySize));

	engine.startGroup(
		0,
		state.graphicHelper.globalViewport.roundedHeight - state.graphicHelper.globalViewport.hGrid * (debugText.length + 1)
	);

	for (let i = 0; i < debugText.length; i++) {
		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fillColors);
		engine.drawSprite(
			0,
			i * state.graphicHelper.globalViewport.hGrid,
			'moduleBackground',
			(debugText[i].length + 2) * state.graphicHelper.globalViewport.vGrid,
			state.graphicHelper.globalViewport.hGrid
		);

		engine.setSpriteLookup(state.graphicHelper.spriteLookups.fontCode);
		engine.drawText(
			state.graphicHelper.globalViewport.vGrid,
			i * state.graphicHelper.globalViewport.hGrid,
			debugText[i]
		);
	}

	engine.endGroup();
}
