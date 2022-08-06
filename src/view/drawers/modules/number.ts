import { Engine } from '@8f4e/2d-engine';
import { font } from '@8f4e/sprite-generator';
import { State } from '../../../state/types';

export default function drawer(engine: Engine, state: State, id: string): void {
	const address = state.compiler.memoryAddressLookup[id]['out:1'];

	if (!address) {
		return;
	}

	const value = state.compiler.memoryBuffer[address];

	engine.setSpriteLookup(font('small_white'));
	engine.drawText(state.viewport.vGrid, state.viewport.hGrid * 3, `${value}`);
}
