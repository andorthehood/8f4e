import { Engine } from '2d-engine';
import { scope } from 'sprite-generator';
import { State } from '../../../state/types';

const RESOLUTION = 49;

export default function drawer(engine: Engine, state: State, id: string): void {
	const bufferAddress = state.compiler.memoryAddressLookup[id]['buffer'] / 4;
	const pointerAddress = state.compiler.memoryAddressLookup[id]['bufferPointer'] / 4;
	const buffer = state.compiler.memoryBuffer.slice(bufferAddress, bufferAddress + RESOLUTION);
	const pointer =
		state.compiler.memoryBuffer[pointerAddress] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT - bufferAddress;

	engine.setSpriteLookup(scope);

	for (let i = 0; i < RESOLUTION; i++) {
		engine.drawSprite(2 * i + 1, 1, buffer[(i + pointer) % RESOLUTION], 2, RESOLUTION * 2);
	}
}
