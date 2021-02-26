import { scope } from '../../spriteGenerator';

const RESOLUTION = 49;

const drawer = function (engine, state, id) {
	const bufferAddress = state.ui.compiler.outputAddressLookup[id + 'buffer'] / 4;
	const pointerAddress = state.ui.compiler.outputAddressLookup[id + 'bufferPointer'] / 4;
	const buffer = state.ui.compiler.memoryBuffer.slice(bufferAddress, bufferAddress + RESOLUTION);
	const pointer = state.ui.compiler.memoryBuffer[pointerAddress] / Int32Array.BYTES_PER_ELEMENT - bufferAddress;

	engine.setSpriteLookup(scope);

	for (let i = 0; i < RESOLUTION; i++) {
		engine.drawSprite(2 * i + 1, 1, buffer[(i + pointer) % RESOLUTION], 2, RESOLUTION * 2);
	}
};

export default drawer;
