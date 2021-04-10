import { font } from '../../../../packages/sprite-generator/src';

const drawer = function (engine, state, id) {
	const address =
		state.ui.compiler.outputAddressLookup[id + '_' + 'out'] / state.ui.compiler.memoryBuffer.BYTES_PER_ELEMENT;

	if (!address) {
		return;
	}

	const value = state.ui.compiler.memoryBuffer[address];

	engine.setSpriteLookup(font('small_white'));
	engine.drawText(20, 20, `${value}`);
};

export default drawer;
