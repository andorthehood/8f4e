import parseMidiInDirectives from './directives';

import type { CodeError, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { EditorEnvironmentPluginContext } from '../types';
import type { MidiInBinding, MidiInputLookup } from './types';

type MidiCallback = (...args: number[]) => unknown;

interface MidiCallbackBinding {
	binding: MidiInBinding;
	callback: MidiCallback;
}

interface ActiveMidiInputListener {
	input: MIDIInput;
	handler: (event: unknown) => void;
}

interface ResolvedMidiCallbacks {
	callbacksByPort: Map<string, MidiCallbackBinding[]>;
	errors: CodeError[];
}

interface MidiInOptions {
	store: StateManager<State>;
	setErrors: EditorEnvironmentPluginContext['setErrors'];
	getInputPort: MidiInputLookup;
	wasmExports: EditorEnvironmentPluginContext['wasmExports'];
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

function resolveMidiCallbacks(
	bindings: MidiInBinding[],
	exports: WebAssembly.Exports,
	getInputPort: MidiInputLookup
): ResolvedMidiCallbacks {
	const callbacksByPort = new Map<string, MidiCallbackBinding[]>();
	const errors: CodeError[] = [];

	for (const binding of bindings) {
		const callback = exports[binding.exportName];
		if (typeof callback !== 'function') {
			errors.push(
				createBindingError(binding, `Missing callable WebAssembly export for @midiIn callback "${binding.exportName}".`)
			);
			continue;
		}

		if (!getInputPort(binding.port)) {
			errors.push(createBindingError(binding, `MIDI input port "${binding.port}" is not available.`));
			continue;
		}

		const callbacks = callbacksByPort.get(binding.port) ?? [];
		callbacks.push({ binding, callback: callback as MidiCallback });
		callbacksByPort.set(binding.port, callbacks);
	}

	return { callbacksByPort, errors };
}

function attachMidiInputListeners({
	callbacksByPort,
	getInputPort,
	activeListeners,
	baseErrors,
	setErrors,
}: {
	callbacksByPort: Map<string, MidiCallbackBinding[]>;
	getInputPort: MidiInputLookup;
	activeListeners: ActiveMidiInputListener[];
	baseErrors: CodeError[];
	setErrors: EditorEnvironmentPluginContext['setErrors'];
}): void {
	for (const [port, callbacks] of callbacksByPort) {
		const input = getInputPort(port);
		if (!input) {
			continue;
		}

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

export default function createMidiIn({ store, setErrors, getInputPort, wasmExports }: MidiInOptions): MidiInManager {
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
		const bindings = parsed.bindings;

		if (bindings.length === 0) {
			setErrors(errors);
			return;
		}

		void wasmExports
			.getExports()
			.then(exports => {
				if (disposed || generation !== syncGeneration) {
					return;
				}

				if (!exports) {
					setErrors(errors);
					return;
				}

				const resolvedCallbacks = resolveMidiCallbacks(bindings, exports, getInputPort);
				errors.push(...resolvedCallbacks.errors);
				attachMidiInputListeners({
					callbacksByPort: resolvedCallbacks.callbacksByPort,
					getInputPort,
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

	store.subscribe('graphicHelper.codeBlocks', sync);
	store.subscribe('graphicHelper.selectedCodeBlock.code', sync);
	store.subscribe('compiler.isCompiling', sync);
	sync();

	return {
		sync,
		dispose: () => {
			disposed = true;
			syncGeneration++;
			removeInputListeners(activeListeners);
			store.unsubscribe('graphicHelper.codeBlocks', sync);
			store.unsubscribe('graphicHelper.selectedCodeBlock.code', sync);
			store.unsubscribe('compiler.isCompiling', sync);
		},
	};
}
