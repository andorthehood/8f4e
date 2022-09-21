import { Engine } from '@8f4e/2d-engine';
import { scope } from '@8f4e/sprite-generator';

import { State } from '../../../state/types';
import { VGRID } from '../consts';

const RESOLUTION = 64;

export default function drawer(engine: Engine, state: State, id: string): void {
	const bufferAddress = state.compiler.memoryAddressLookup[id]['buffer'];
	const pointerAddress = state.compiler.memoryAddressLookup[id]['bufferPointer'];
	const buffer = state.compiler.memoryBuffer.slice(bufferAddress, bufferAddress + RESOLUTION);
	const pointer =
		state.compiler.memoryBuffer[pointerAddress] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT - bufferAddress;

	engine.setSpriteLookup(scope);

	for (let i = 0; i < RESOLUTION; i++) {
		engine.drawSprite(2 * i + 1, 1, buffer[(i + pointer) % RESOLUTION], 2, RESOLUTION * 2);
	}
}
