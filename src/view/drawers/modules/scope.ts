import { scope } from '../../../../packages/sprite-generator/src';
import { State } from '../../../state/types';

const RESOLUTION = 49;

const drawer = function (engine, state: State, id) {
	const bufferAddress = state.compiler.outputAddressLookup[id + '_' + 'buffer'] / 4;
	const pointerAddress = state.compiler.outputAddressLookup[id + '_' + 'bufferPointer'] / 4;
	const buffer = state.compiler.memoryBuffer.slice(bufferAddress, bufferAddress + RESOLUTION);
	const pointer =
		state.compiler.memoryBuffer[pointerAddress] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT - bufferAddress;

	engine.setSpriteLookup(scope);

	for (let i = 0; i < RESOLUTION; i++) {
		engine.drawSprite(2 * i + 1, 1, buffer[(i + pointer) % RESOLUTION], 2, RESOLUTION * 2);
	}
};

export default drawer;
