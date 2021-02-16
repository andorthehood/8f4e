import { font, scope } from '../../spriteGenerator';

const drawer = function (engine, state, id) {
	const address = state.ui.compiler.outputAddressLookup[id + 'buffer'] / 4;
	const buffer = state.ui.compiler.memoryBuffer.slice(address, address + 8);

	// console.log(buffer);

	engine.setSpriteLookup(scope);

	for (let i = 0; i < 8; i++) {
		engine.drawSprite(10 * i + 10, 20, buffer[i], 10, 80);
	}
};

export default drawer;
