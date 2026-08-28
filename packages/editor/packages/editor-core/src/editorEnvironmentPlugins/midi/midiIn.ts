import type { State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { EditorEnvironmentPluginContext } from '../types';
import { resolveMidiInputBindings } from './config';
import type { MidiInBinding, MidiInputLookup } from './types';

type MidiCallback = (...args: number[]) => unknown;

interface MidiCallbackBinding {
	binding: MidiInBinding;
	callback: MidiCallback;
}

interface MidiInputBinding {
	binding: MidiInBinding;
	input: MIDIInput;
}

interface MidiCallbackGroup {
	input: MIDIInput;
	callbacks: MidiCallbackBinding[];
}

interface ActiveMidiInputListener {
	input: MIDIInput;
	handler: (event: unknown) => void;
}

interface ResolvedMidiCallbacks {
	callbackGroupsByPort: Map<string, MidiCallbackGroup>;
}

interface ResolvedMidiInputPorts {
	bindings: MidiInputBinding[];
}

interface MidiInOptions {
	store: StateManager<State>;
	setErrors: EditorEnvironmentPluginContext['setErrors'];
	getInputPort: MidiInputLookup;
	getWasmExports: EditorEnvironmentPluginContext['services']['getWasmExports'];
}

export interface MidiInManager {
	sync: () => void;
	dispose: () => void;
}

function removeInputListeners(activeListeners: ActiveMidiInputListener[]): void {
	for (const { input, handler } of activeListeners) {
		input.removeEventListener('midimessage', handler as Parameters<MIDIInput['removeEventListener']>[1]);
	}
	activeListeners.length = 0;
}

function getMidiEventBytes(event: unknown): [number, number, number] {
	const data = (event as MIDIMessageEvent).data;

	return [data?.[0] ?? 0, data?.[1] ?? 0, data?.[2] ?? 0];
}

function resolveMidiInputPorts(bindings: MidiInBinding[], getInputPort: MidiInputLookup): ResolvedMidiInputPorts {
	const inputsByPort = new Map<string, MIDIInput | undefined>();
	const availableBindings: MidiInputBinding[] = [];

	for (const binding of bindings) {
		if (!inputsByPort.has(binding.port)) {
			inputsByPort.set(binding.port, getInputPort(binding.port));
		}

		const input = inputsByPort.get(binding.port);
		if (!input) {
			console.error(`MIDI input port "${binding.port}" is not available.`);
			continue;
		}

		availableBindings.push({ binding, input });
	}

	return { bindings: availableBindings };
}

function resolveMidiCallbacks(bindings: MidiInputBinding[], exports: WebAssembly.Exports): ResolvedMidiCallbacks {
	const callbackGroupsByPort = new Map<string, MidiCallbackGroup>();

	for (const { binding, input } of bindings) {
		const callback = exports[binding.exportName];
		if (typeof callback !== 'function') {
			console.error(`Missing callable WebAssembly export for MIDI input callback "${binding.exportName}".`);
			continue;
		}

		const group = callbackGroupsByPort.get(binding.port) ?? { input, callbacks: [] };
		group.callbacks.push({ binding, callback: callback as MidiCallback });
		callbackGroupsByPort.set(binding.port, group);
	}

	return { callbackGroupsByPort };
}

function attachMidiInputListeners({
	callbackGroupsByPort,
	activeListeners,
}: {
	callbackGroupsByPort: Map<string, MidiCallbackGroup>;
	activeListeners: ActiveMidiInputListener[];
}): void {
	for (const { input, callbacks } of callbackGroupsByPort.values()) {
		const handler = (event: unknown) => {
			const [status, data1, data2] = getMidiEventBytes(event);
			for (const { binding, callback } of callbacks) {
				try {
					callback(status, data1, data2);
				} catch (error) {
					console.error(`MIDI input callback "${binding.exportName}" failed.`, error);
				}
			}
		};

		input.addEventListener('midimessage', handler as Parameters<MIDIInput['addEventListener']>[1]);
		activeListeners.push({ input, handler });
	}
}

export default function createMidiIn({ store, setErrors, getInputPort, getWasmExports }: MidiInOptions): MidiInManager {
	const activeListeners: ActiveMidiInputListener[] = [];
	let disposed = false;
	let syncGeneration = 0;

	function sync(): void {
		if (disposed) {
			return;
		}

		const state = store.getState();
		if (state.compiler.isCompiling) {
			return;
		}

		const generation = ++syncGeneration;
		removeInputListeners(activeListeners);

		const resolvedPorts = resolveMidiInputPorts(resolveMidiInputBindings(state), getInputPort);
		const bindings = resolvedPorts.bindings;

		if (bindings.length === 0) {
			setErrors([]);
			return;
		}

		void getWasmExports()
			.then(wasmExports => wasmExports.getExports())
			.then(exports => {
				if (disposed || generation !== syncGeneration) {
					return;
				}

				if (!exports) {
					setErrors([]);
					return;
				}

				const resolvedCallbacks = resolveMidiCallbacks(bindings, exports);
				attachMidiInputListeners({
					callbackGroupsByPort: resolvedCallbacks.callbackGroupsByPort,
					activeListeners,
				});

				setErrors([]);
			})
			.catch(error => {
				if (disposed || generation !== syncGeneration) {
					return;
				}

				console.error('Failed to instantiate MIDI input WebAssembly module:', error);
				setErrors([]);
			});
	}

	store.subscribe('codeBlockRendering.codeBlocks', sync);
	store.subscribe('codeBlockRendering.selectedCodeBlock.code', sync);
	store.subscribe('editorConfig.midi', sync);
	store.subscribe('compiler.isCompiling', sync);
	sync();

	return {
		sync,
		dispose: () => {
			disposed = true;
			syncGeneration++;
			removeInputListeners(activeListeners);
			store.unsubscribe('codeBlockRendering.codeBlocks', sync);
			store.unsubscribe('codeBlockRendering.selectedCodeBlock.code', sync);
			store.unsubscribe('editorConfig.midi', sync);
			store.unsubscribe('compiler.isCompiling', sync);
		},
	};
}
