import { Engine } from '@8f4e/2d-engine';

import { ModuleGraphicData, State } from '../../../state/types';

const RESOLUTION = 64;

const scopeBuffers = new Map<number, Int32Array>();
const bufferPointers = new Map<number, number>();

export default function drawer(engine: Engine, state: State, module: ModuleGraphicData): void {
	if (!state.graphicHelper.spriteLookups) {
		return;
	}

	engine.setSpriteLookup(state.graphicHelper.spriteLookups.scope);

	for (const [, { x, y, id: scopeId }] of module.scopes) {
		const memory = state.compiler.compiledModules.get(module.id)?.memoryMap.get(scopeId);

		if (!memory) {
			continue;
		}

		const { wordAddress } = memory;
		const value = state.compiler.memoryBuffer[wordAddress] || 0;

		const buffer = scopeBuffers.get(wordAddress);
		const bufferPointer = bufferPointers.get(wordAddress);

		if (!buffer || typeof bufferPointer === 'undefined') {
			scopeBuffers.set(wordAddress, new Int32Array(RESOLUTION));
			bufferPointers.set(wordAddress, 0);
			continue;
		}

		buffer[bufferPointer] = Math.round(value / 2);
		bufferPointers.set(wordAddress, ((bufferPointers.get(wordAddress) || 0) + 1) % RESOLUTION);

		engine.startGroup(x, y);

		for (let i = 0; i < RESOLUTION; i++) {
			engine.drawSprite(i * 4, 0, buffer[i], 4, state.graphicHelper.viewport.hGrid * 8);
		}

		engine.endGroup();
	}
}
