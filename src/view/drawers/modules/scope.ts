import { Engine } from '@8f4e/2d-engine';
import { scope } from '@8f4e/sprite-generator';

import { Module, State } from '../../../state/types';

const RESOLUTION = 64;

const scopeBuffers = new Map<number, Int32Array>();
const bufferPointers = new Map<number, number>();

export default function drawer(engine: Engine, state: State, module: Module): void {
	const graphicData = state.graphicHelper.modules.get(module);

	if (!graphicData) {
		return;
	}

	engine.setSpriteLookup(scope);

	for (const [, { x, y, id: scopeId }] of graphicData.scopes) {
		const { byteAddress = 0 } = state.compiler.compiledModules.get(graphicData.id)?.memoryMap.get(scopeId) || {};
		const value = state.compiler.memoryBuffer[byteAddress / 4] || 0;

		const buffer = scopeBuffers.get(byteAddress);
		const bufferPointer = bufferPointers.get(byteAddress);

		if (!buffer || typeof bufferPointer === 'undefined') {
			scopeBuffers.set(byteAddress, new Int32Array(RESOLUTION));
			bufferPointers.set(byteAddress, 0);
			return;
		}

		buffer[bufferPointer] = value;
		bufferPointers.set(byteAddress, ((bufferPointers.get(byteAddress) || 0) + 1) % RESOLUTION);

		engine.startGroup(x, y);

		for (let i = 0; i < RESOLUTION; i++) {
			engine.drawSprite(2 * i + 1, 1, buffer[i], 2, RESOLUTION * 2);
		}

		engine.endGroup();
	}
}
