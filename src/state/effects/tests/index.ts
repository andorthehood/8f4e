import { State } from '../../types';
import addRemoveModules from './addRemoveModules';

export default function tests(state: State, events: EventDispatcher): void {
	addRemoveModules(state, events);
}
