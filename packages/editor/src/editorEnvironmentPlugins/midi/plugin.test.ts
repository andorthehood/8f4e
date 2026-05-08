import { describe, expect, it, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import midiPlugin from './plugin';

import type { DataStructure } from '@8f4e/compiler-types';
import type { State } from '@8f4e/editor-state-types';
import type { EditorEnvironmentPluginContext } from '../types';

type MidiMessageHandler = (event: MIDIMessageEvent) => void;

interface MIDIPortMock {
	id?: string;
	manufacturer?: string | null;
	name?: string | null;
	state?: string;
	addEventListener?: (type: string, handler: MidiMessageHandler) => void;
	removeEventListener?: (type: string, handler: MidiMessageHandler) => void;
	emitMidiMessage?: (event: MIDIMessageEvent) => void;
}

interface MIDIAccessMock {
	inputs: Map<string, MIDIPortMock>;
	outputs: Map<string, MIDIPortMock>;
	onstatechange: ((event: unknown) => void) | null;
}

type NavigatorMock = Partial<Navigator> & {
	requestMIDIAccess?: () => Promise<MIDIAccess>;
};

function createMemory(type: string, wordAlignedAddress: number, numberOfElements = 1): DataStructure {
	return {
		id: type,
		type: type as DataStructure['type'],
		byteAddress: wordAlignedAddress * 4,
		wordAlignedAddress,
		wordAlignedSize: numberOfElements,
		numberOfElements,
		elementWordSize: 4,
		default: 0,
		isInteger: true,
		isPointingToPointer: false,
		isUnsigned: false,
	} as DataStructure;
}

function createState(): State {
	return {
		info: {},
		graphicHelper: {
			codeBlocks: [
				{
					id: 'midi-block',
					moduleId: 'midiIn',
					blockType: 'module',
					parsedDirectives: [
						{
							prefix: '@',
							name: 'midiInput',
							args: ['input-a', 'buffer', 'readIndex', 'writeIndex', 'dropped'],
							rawRow: 6,
							isTrailing: false,
						},
					],
				},
			],
		},
		compiler: {
			compiledModules: {
				midiIn: {
					memoryMap: {
						buffer: createMemory('int[]', 0, 10),
						readIndex: createMemory('int', 20),
						writeIndex: createMemory('int', 21),
						dropped: createMemory('int', 22),
					},
				},
			},
		},
	} as unknown as State;
}

function createMidiInputPort(id: string, name: string): MIDIPortMock {
	const handlers = new Set<MidiMessageHandler>();

	return {
		id,
		name,
		state: 'connected',
		addEventListener: vi.fn((type: string, handler: MidiMessageHandler) => {
			if (type === 'midimessage') {
				handlers.add(handler);
			}
		}),
		removeEventListener: vi.fn((type: string, handler: MidiMessageHandler) => {
			if (type === 'midimessage') {
				handlers.delete(handler);
			}
		}),
		emitMidiMessage: (event: MIDIMessageEvent) => {
			handlers.forEach(handler => handler(event));
		},
	};
}

function createStore(state: State = createState()) {
	return createStateManager(state);
}

function createContext({
	store,
	navigator,
	memory,
	setErrors = vi.fn(),
}: {
	store: ReturnType<typeof createStore>;
	navigator: NavigatorMock;
	memory?: Int32Array;
	setErrors?: EditorEnvironmentPluginContext['setErrors'];
}): EditorEnvironmentPluginContext {
	return {
		store,
		events: {} as never,
		window: {} as Window,
		navigator: navigator as unknown as Navigator,
		memoryViews: {
			int8: new Int8Array(memory?.buffer ?? new ArrayBuffer(0)),
			int16: new Int16Array(memory?.buffer ?? new ArrayBuffer(0)),
			int32: memory ?? new Int32Array(0),
			uint8: new Uint8Array(memory?.buffer ?? new ArrayBuffer(0)),
			uint16: new Uint16Array(memory?.buffer ?? new ArrayBuffer(0)),
			float32: new Float32Array(memory?.buffer ?? new ArrayBuffer(0)),
			float64: new Float64Array(memory?.buffer ?? new ArrayBuffer(0)),
		},
		setErrors,
	};
}

async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

function createMidiMessage(data: number[], timeStamp = 123): MIDIMessageEvent {
	return {
		data: new Uint8Array(data),
		timeStamp,
	} as MIDIMessageEvent;
}

describe('midiPlugin', () => {
	it('publishes connected MIDI devices when @midiInput is active', async () => {
		const store = createStore();
		const input = createMidiInputPort('input-a', 'Keys');
		const access: MIDIAccessMock = {
			inputs: new Map([['input-a', input]]),
			outputs: new Map([
				[
					'output-a',
					{
						id: 'output-a',
						name: 'Synth',
						state: 'connected',
					},
				],
			]),
			onstatechange: null,
		};
		const requestMIDIAccess = vi.fn(async () => access as unknown as MIDIAccess);

		const cleanup = midiPlugin(createContext({ store, navigator: { requestMIDIAccess } }));

		expect(store.getState().info.midi).toEqual({});

		await flushPromises();

		expect(requestMIDIAccess).toHaveBeenCalledTimes(1);
		expect(store.getState().info.midi).toEqual({
			'input-a': 'Keys (in)',
			'output-a': 'Synth (out)',
		});

		cleanup();

		expect(store.getState().info.midi).toBeUndefined();
	});

	it('writes raw MIDI messages into the configured SPSC buffer', async () => {
		const store = createStore();
		const memory = new Int32Array(32);
		const input = createMidiInputPort('input-a', 'Keys');
		const access: MIDIAccessMock = {
			inputs: new Map([['input-a', input]]),
			outputs: new Map(),
			onstatechange: null,
		};

		midiPlugin(
			createContext({
				store,
				memory,
				navigator: { requestMIDIAccess: vi.fn(async () => access as unknown as MIDIAccess) },
			})
		);
		await flushPromises();

		input.emitMidiMessage?.(createMidiMessage([0x90, 60, 100], 456.7));

		expect(Array.from(memory.slice(0, 5))).toEqual([0, 0x90, 60, 100, 456]);
		expect(memory[21]).toBe(1);
	});

	it('drops newest MIDI messages when the SPSC buffer is full', async () => {
		const store = createStore();
		const memory = new Int32Array(32);
		memory[20] = 0;
		memory[21] = 1;
		const input = createMidiInputPort('input-a', 'Keys');
		const access: MIDIAccessMock = {
			inputs: new Map([['input-a', input]]),
			outputs: new Map(),
			onstatechange: null,
		};

		midiPlugin(
			createContext({
				store,
				memory,
				navigator: { requestMIDIAccess: vi.fn(async () => access as unknown as MIDIAccess) },
			})
		);
		await flushPromises();

		input.emitMidiMessage?.(createMidiMessage([0x90, 60, 100]));

		expect(memory[22]).toBe(1);
		expect(memory[21]).toBe(1);
		expect(Array.from(memory.slice(5, 10))).toEqual([0, 0, 0, 0, 0]);
	});

	it('restores an existing MIDI statechange handler on cleanup', async () => {
		const store = createStore();
		const previousStateChangeHandler = vi.fn();
		const input = createMidiInputPort('input-a', 'Keys');
		const access: MIDIAccessMock = {
			inputs: new Map([['input-a', input]]),
			outputs: new Map(),
			onstatechange: previousStateChangeHandler,
		};

		const cleanup = midiPlugin(
			createContext({
				store,
				navigator: { requestMIDIAccess: vi.fn(async () => access as unknown as MIDIAccess) },
			})
		);
		await flushPromises();
		access.onstatechange?.('state-change');

		expect(previousStateChangeHandler).toHaveBeenCalledWith('state-change');

		cleanup();

		expect(access.onstatechange).toBe(previousStateChangeHandler);
		expect(input.removeEventListener).toHaveBeenCalledWith('midimessage', expect.any(Function));
	});
});
