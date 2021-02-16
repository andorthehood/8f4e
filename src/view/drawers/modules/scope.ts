import { font, scope } from '../../spriteGenerator';

const drawer = function (engine, state, id) {
	const address = state.ui.compiler.outputAddressLookup[id + 'buffer'] / 4;
	const buffer = state.ui.compiler.memoryBuffer.slice(address, address + 80);

	engine.setSpriteLookup(scope);

	for (let i = 0; i < 80; i++) {
		engine.drawSprite(1 * i + 10, 20, buffer[i], 1, 80);
	}
};

export default drawer;
