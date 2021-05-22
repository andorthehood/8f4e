import { font } from '../../../../packages/sprite-generator/src';
import { State } from '../../../state/types';

const drawer = function (engine, state: State, id) {
	const address =
		state.compiler.outputAddressLookup[id + '_' + 'out:1'] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT;

	if (!address) {
		return;
	}

	const value = state.compiler.memoryBuffer[address];

	engine.setSpriteLookup(font('small_white'));
	engine.drawText(20, 20, `${value}`);
};

export default drawer;
