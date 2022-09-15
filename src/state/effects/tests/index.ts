import addRemoveModules from './addRemoveModules';

import { EventDispatcher } from '../../../events';
import { State } from '../../types';

export default function tests(state: State, events: EventDispatcher): void {
	addRemoveModules(state, events);
}
