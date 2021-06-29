import { EventDispatcher } from '../../../events';
import { State } from '../../types';

const sleep = async time => new Promise(resolve => setTimeout(resolve, time));

export default function addRemoveModules(state: State, events: EventDispatcher): void {
	async function onRunTest() {
		for (let i = 0; i < 100; i++) {
			await sleep(100);
			events.dispatch('addModule', { x: i * 20, y: i * 10, type: 'scope' });
		}
	}

	events.on('runTest', onRunTest);
}
