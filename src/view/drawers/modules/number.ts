import { Engine } from '../../../../packages/2d-engine/src';
import { font } from '../../../../packages/sprite-generator/src';
import { State } from '../../../state/types';

export default function drawer(engine: Engine, state: State, id: string): void {
	const address =
		state.compiler.outputAddressLookup[id + '_' + 'out:1'] / state.compiler.memoryBuffer.BYTES_PER_ELEMENT;

	if (!address) {
		return;
	}

	const value = state.compiler.memoryBuffer[address];

	engine.setSpriteLookup(font('small_white'));
	engine.drawText(20, 20, `${value}`);
}
