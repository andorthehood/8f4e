import { CompiledModule, MemoryBuffer, MemoryTypes } from 'compiler';
import { EventDispatcher } from '../../events';
import { State } from '../types';

function extractState(module: CompiledModule, memoryBuffer: MemoryBuffer): Record<string, number | number[]> {
	return module.memoryMap.reduce((accumulator, current) => {
		const moduleAddress = module.wordAddress;

		if (current.type === MemoryTypes.NUMBER && current.id) {
			accumulator[current.id] = memoryBuffer[moduleAddress + current.address];
		}

		if (current.type === MemoryTypes.STATIC_ARRAY && current.id) {
			accumulator[current.id] = memoryBuffer.slice(moduleAddress + current.address, moduleAddress + current.size);
		}

		if (current.type === MemoryTypes.DYNAMIC_ARRAY && current.id) {
			const size = memoryBuffer[moduleAddress + current.sizePointer];
			accumulator[current.id] = memoryBuffer.slice(
				moduleAddress + current.address,
				moduleAddress + current.address + size
			);
		}

		return accumulator;
	}, {});
}

export default function loader(state: State, events: EventDispatcher, defaultState: State): void {
	const localState = JSON.parse(localStorage.getItem('state')) || {};

	Object.keys(localState).forEach(key => {
		state[key] = localState[key] || defaultState[key];
	});

	if (state.sructureVersion !== defaultState.sructureVersion) {
		Object.keys(defaultState).forEach(key => {
			state[key] = defaultState[key];
		});
	}
	state.history = [];

	// @ts-ignore
	window.state = state;

	function onSaveState() {
		state.modules.forEach(({ type }, index) => {
			if (state.moduleTypes[type].extractState) {
				state.modules[index].state = state.moduleTypes[type].extractState(
					state.compiler.memoryBuffer,
					state.compiler.memoryAddressLookup[state.modules[index].id].__startAddress
				);
			}
		});

		localStorage.setItem(
			'state',
			JSON.stringify({
				connections: state.connections,
				modules: state.modules,
				sructureVersion: state.sructureVersion,
				viewport: state.viewport,
			})
		);
	}

	events.on('saveState', onSaveState);
}
