import { State } from '../../types';
import addRemoveModules from './addRemoveModules';

export default function tests(state: State, events) {
	addRemoveModules(state, events);
}
