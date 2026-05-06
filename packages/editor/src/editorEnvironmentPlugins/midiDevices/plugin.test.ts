import { describe, expect, it, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import midiDevicesPlugin from './plugin';

import type { State } from '@8f4e/editor-state-types';
import type { EditorEnvironmentPluginContext } from '../types';

interface MIDIPortMock {
	id?: string;
	manufacturer?: string | null;
	name?: string | null;
	state?: string;
}

interface MIDIAccessMock {
	inputs: Map<string, MIDIPortMock>;
	outputs: Map<string, MIDIPortMock>;
	onstatechange: ((event: unknown) => void) | null;
}

type NavigatorMock = Partial<Navigator> & {
	requestMIDIAccess?: () => Promise<MIDIAccess>;
};

function createStore() {
	return createStateManager({
		info: {},
	} as unknown as State);
}

async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

function createContext(
	store: ReturnType<typeof createStore>,
	navigator: NavigatorMock
): EditorEnvironmentPluginContext {
	return {
		store,
		events: {} as never,
		window: {} as Window,
		navigator: navigator as unknown as Navigator,
		memoryViews: {} as never,
		setErrors: () => {},
	};
}

describe('midiDevicesPlugin', () => {
	it('commits an empty MIDI device list when Web MIDI is unavailable', () => {
		const store = createStore();
		const cleanup = midiDevicesPlugin(createContext(store, {}));

		expect(store.getState().info.midi).toEqual({});

		cleanup();

		expect(store.getState().info.midi).toBeUndefined();
	});

	it('commits available MIDI devices into state.info.midi', async () => {
		const store = createStore();
		const access: MIDIAccessMock = {
			inputs: new Map([
				[
					'input-a',
					{
						id: 'input-a',
						manufacturer: 'Acme',
						name: 'Keys',
						state: 'connected',
					},
				],
			]),
			outputs: new Map([
				[
					'output-a',
					{
						id: 'output-a',
						manufacturer: 'Acme',
						name: 'Synth',
						state: 'connected',
					},
				],
			]),
			onstatechange: null,
		};
		const requestMIDIAccess = vi.fn(async () => access as unknown as MIDIAccess);
		const cleanup = midiDevicesPlugin(createContext(store, { requestMIDIAccess }));

		expect(store.getState().info.midi).toEqual({});

		await flushPromises();

		expect(requestMIDIAccess).toHaveBeenCalledTimes(1);
		expect(store.getState().info.midi).toEqual({
			'input-a': 'Keys (in)',
			'output-a': 'Synth (out)',
		});

		access.inputs.set('input-b', {
			id: 'input-b',
			name: 'Pads',
			state: 'connected',
		});
		access.outputs.set('output-b', {
			id: 'output-b',
			name: 'Disconnected output',
			state: 'disconnected',
		});
		access.onstatechange?.({});

		expect(store.getState().info.midi).toEqual({
			'input-a': 'Keys (in)',
			'input-b': 'Pads (in)',
			'output-a': 'Synth (out)',
		});

		cleanup();

		expect(store.getState().info.midi).toBeUndefined();
	});

	it('restores an existing MIDI statechange handler on cleanup', async () => {
		const store = createStore();
		const previousStateChangeHandler = vi.fn();
		const access: MIDIAccessMock = {
			inputs: new Map(),
			outputs: new Map(),
			onstatechange: previousStateChangeHandler,
		};
		const cleanup = midiDevicesPlugin(
			createContext(store, { requestMIDIAccess: vi.fn(async () => access as unknown as MIDIAccess) })
		);

		await flushPromises();
		access.onstatechange?.('state-change');

		expect(previousStateChangeHandler).toHaveBeenCalledWith('state-change');

		cleanup();

		expect(access.onstatechange).toBe(previousStateChangeHandler);
	});
});
