import type { CodeError, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { EditorEnvironmentPluginContext } from '../types';
import parseMidiInDirectives from './directives';
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
	errors: CodeError[];
}

interface ResolvedMidiInputPorts {
	bindings: MidiInputBinding[];
	errors: CodeError[];
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

function createBindingError(binding: MidiInBinding, message: string): CodeError {
	return {
		codeBlockId: binding.codeBlockId,
		codeBlockType: binding.codeBlockType,
		lineNumber: binding.lineNumber,
		message,
	};
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
	const errors: CodeError[] = [];

	for (const binding of bindings) {
		if (!inputsByPort.has(binding.port)) {
			inputsByPort.set(binding.port, getInputPort(binding.port));
		}

		const input = inputsByPort.get(binding.port);
		if (!input) {
			errors.push(createBindingError(binding, `MIDI input port "${binding.port}" is not available.`));
			continue;
		}

		availableBindings.push({ binding, input });
	}

	return { bindings: availableBindings, errors };
}

function resolveMidiCallbacks(bindings: MidiInputBinding[], exports: WebAssembly.Exports): ResolvedMidiCallbacks {
	const callbackGroupsByPort = new Map<string, MidiCallbackGroup>();
	const errors: CodeError[] = [];

	for (const { binding, input } of bindings) {
		const callback = exports[binding.exportName];
		if (typeof callback !== 'function') {
			errors.push(
				createBindingError(binding, `Missing callable WebAssembly export for @midiIn callback "${binding.exportName}".`)
			);
			continue;
		}

		const group = callbackGroupsByPort.get(binding.port) ?? { input, callbacks: [] };
		group.callbacks.push({ binding, callback: callback as MidiCallback });
		callbackGroupsByPort.set(binding.port, group);
	}

	return { callbackGroupsByPort, errors };
}

function attachMidiInputListeners({
	callbackGroupsByPort,
	activeListeners,
	baseErrors,
	setErrors,
}: {
	callbackGroupsByPort: Map<string, MidiCallbackGroup>;
	activeListeners: ActiveMidiInputListener[];
	baseErrors: CodeError[];
	setErrors: EditorEnvironmentPluginContext['setErrors'];
}): void {
	for (const { input, callbacks } of callbackGroupsByPort.values()) {
		const handler = (event: unknown) => {
			const [status, data1, data2] = getMidiEventBytes(event);
			const callbackErrors: CodeError[] = [];
			for (const { binding, callback } of callbacks) {
				try {
					callback(status, data1, data2);
				} catch (error) {
					console.error('MIDI input callback failed:', error);
					callbackErrors.push(createBindingError(binding, `MIDI input callback "${binding.exportName}" failed.`));
				}
			}

			if (callbackErrors.length > 0) {
				setErrors([...baseErrors, ...callbackErrors]);
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

		const parsed = parseMidiInDirectives(state);
		const errors: CodeError[] = [...parsed.errors];
		const resolvedPorts = resolveMidiInputPorts(parsed.bindings, getInputPort);
		errors.push(...resolvedPorts.errors);
		const bindings = resolvedPorts.bindings;

		if (bindings.length === 0) {
			setErrors(errors);
			return;
		}

		void getWasmExports()
			.then(wasmExports => wasmExports.getExports())
			.then(exports => {
				if (disposed || generation !== syncGeneration) {
					return;
				}

				if (!exports) {
					setErrors(errors);
					return;
				}

				const resolvedCallbacks = resolveMidiCallbacks(bindings, exports);
				errors.push(...resolvedCallbacks.errors);
				attachMidiInputListeners({
					callbackGroupsByPort: resolvedCallbacks.callbackGroupsByPort,
					activeListeners,
					baseErrors: errors,
					setErrors,
				});

				setErrors(errors);
			})
			.catch(error => {
				if (disposed || generation !== syncGeneration) {
					return;
				}

				console.error('Failed to instantiate MIDI input WebAssembly module:', error);
				setErrors(errors);
			});
	}

	store.subscribe('codeBlockRendering.codeBlocks', sync);
	store.subscribe('codeBlockRendering.selectedCodeBlock.code', sync);
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
			store.unsubscribe('compiler.isCompiling', sync);
		},
	};
}
