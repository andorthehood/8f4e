import { describe, expect, it, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import createMidiDeviceManager from './devices';

import type { State } from '@8f4e/editor-state-types';

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

function createStore() {
	return createStateManager({
		info: {},
	} as unknown as State);
}

async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe('createMidiDeviceManager', () => {
	it('commits an empty MIDI device list when Web MIDI is unavailable', () => {
		const store = createStore();
		const manager = createMidiDeviceManager({ store, navigator: {} as Navigator });

		expect(store.getState().info.midi).toEqual({});

		manager.dispose();

		expect(store.getState().info.midi).toBeUndefined();
	});

	it('commits available MIDI devices into state.info.midi', async () => {
		const store = createStore();
		const access: MIDIAccessMock = {
			inputs: new Map([
				[
					'input-a',
					{
						id: '-1710537465',
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
		const manager = createMidiDeviceManager({
			store,
			navigator: { requestMIDIAccess } as unknown as Navigator,
		});

		expect(store.getState().info.midi).toEqual({});

		await flushPromises();

		expect(requestMIDIAccess).toHaveBeenCalledTimes(1);
		expect(store.getState().info.midi).toEqual({
			'0': 'Keys (in)',
			'1': 'Synth (out)',
		});
		expect(manager.getInputPort('0')).toBe(access.inputs.get('input-a'));
		expect(manager.getInputPort('-1710537465')).toBeUndefined();
		expect(manager.getInputPort('1')).toBeUndefined();

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
			'0': 'Keys (in)',
			'1': 'Synth (out)',
			'2': 'Pads (in)',
		});
		expect(manager.getInputPort('2')).toBe(access.inputs.get('input-b'));

		access.inputs.get('input-a')!.state = 'disconnected';
		access.onstatechange?.({});

		expect(store.getState().info.midi).toEqual({
			'1': 'Synth (out)',
			'2': 'Pads (in)',
		});
		expect(manager.getInputPort('0')).toBeUndefined();
		expect(manager.getInputPort('2')).toBe(access.inputs.get('input-b'));

		access.inputs.get('input-a')!.state = 'connected';
		access.onstatechange?.({});

		expect(store.getState().info.midi).toEqual({
			'0': 'Keys (in)',
			'1': 'Synth (out)',
			'2': 'Pads (in)',
		});
		expect(manager.getInputPort('0')).toBe(access.inputs.get('input-a'));

		manager.dispose();

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
		const manager = createMidiDeviceManager({
			store,
			navigator: {
				requestMIDIAccess: vi.fn(async () => access as unknown as MIDIAccess),
			} as unknown as Navigator,
		});

		await flushPromises();
		access.onstatechange?.('state-change');

		expect(previousStateChangeHandler).toHaveBeenCalledWith('state-change');

		manager.dispose();

		expect(access.onstatechange).toBe(previousStateChangeHandler);
	});
});
