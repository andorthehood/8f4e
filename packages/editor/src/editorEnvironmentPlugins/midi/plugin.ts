import createMidiInfo from './midiDevices';
import { resolveMidiInputBindings } from './midiInputDirectives';
import { writeMidiInputRecord } from './midiInputWriter';

import type { CodeError, InfoRecord } from '@8f4e/editor-state-types';
import type { EditorEnvironmentPluginContext } from '../types';
import type { MidiInputBinding } from './midiInputDirectives';

function findInputPort(access: MIDIAccess, portId: string): MIDIInput | undefined {
	let result: MIDIInput | undefined;
	access.inputs.forEach(input => {
		if (input.id === portId) {
			result = input;
		}
	});

	return result;
}

export default function midiPlugin({
	store,
	navigator,
	memoryViews,
	setErrors,
}: EditorEnvironmentPluginContext): () => void {
	const requestMIDIAccess = (navigator as unknown as { requestMIDIAccess?: Navigator['requestMIDIAccess'] })
		.requestMIDIAccess;
	let disposed = false;
	let midiAccess: MIDIAccess | undefined;
	let previousStateChangeHandler: MIDIAccess['onstatechange'] = null;
	let inputCleanups: (() => void)[] = [];
	let sequence = 0;

	function setMidiInfo(info: InfoRecord | undefined): void {
		store.set('info.midi', info);
	}

	function cleanupInputs(): void {
		inputCleanups.forEach(cleanup => cleanup());
		inputCleanups = [];
	}

	function createUnavailablePortErrors(bindings: MidiInputBinding[]): CodeError[] {
		if (!midiAccess) {
			return [];
		}

		return bindings.flatMap(binding => {
			const input = findInputPort(midiAccess!, binding.portId);
			if (input && (!input.state || input.state === 'connected')) {
				return [];
			}

			return [
				{
					codeBlockId: binding.codeBlockId,
					lineNumber: binding.lineNumber,
					message: `@midiInput: MIDI input port '${binding.portId}' is not connected`,
				},
			];
		});
	}

	function attachInputs(bindings: MidiInputBinding[]): void {
		cleanupInputs();

		if (!midiAccess) {
			return;
		}

		for (const binding of bindings) {
			const input = findInputPort(midiAccess, binding.portId);
			if (!input || (input.state && input.state !== 'connected')) {
				continue;
			}

			const onMidiMessage = (event: MIDIMessageEvent) => {
				writeMidiInputRecord(memoryViews, binding, event, sequence++);
			};
			input.addEventListener('midimessage', onMidiMessage);
			inputCleanups.push(() => input.removeEventListener('midimessage', onMidiMessage));
		}
	}

	function sync(): void {
		if (disposed) {
			return;
		}

		const { bindings, errors } = resolveMidiInputBindings(store.getState());
		const portErrors = createUnavailablePortErrors(bindings);
		setErrors([...errors, ...portErrors]);
		attachInputs(bindings);

		if (midiAccess) {
			setMidiInfo(createMidiInfo(midiAccess));
		}
	}

	if (typeof requestMIDIAccess !== 'function') {
		setMidiInfo({});
		const { bindings, errors } = resolveMidiInputBindings(store.getState());
		setErrors([
			...errors,
			...bindings.map(binding => ({
				codeBlockId: binding.codeBlockId,
				lineNumber: binding.lineNumber,
				message: '@midiInput: Web MIDI API is not available',
			})),
		]);

		return () => {
			disposed = true;
			setErrors([]);
			setMidiInfo(undefined);
		};
	}

	setMidiInfo({});

	void requestMIDIAccess
		.call(navigator)
		.then(access => {
			if (disposed) {
				return;
			}

			midiAccess = access;
			previousStateChangeHandler = access.onstatechange;
			access.onstatechange = function (event) {
				previousStateChangeHandler?.call(access, event);
				sync();
			};
			sync();
		})
		.catch(() => {
			if (!disposed) {
				setMidiInfo({});
				setErrors([
					{
						codeBlockId: 'midi',
						lineNumber: 0,
						message: '@midiInput: failed to access MIDI devices',
					},
				]);
			}
		});

	store.subscribe('graphicHelper.codeBlocks', sync);
	store.subscribe('graphicHelper.selectedCodeBlock.code', sync);
	store.subscribe('compiler.compiledModules', sync);

	return () => {
		disposed = true;
		store.unsubscribe('graphicHelper.codeBlocks', sync);
		store.unsubscribe('graphicHelper.selectedCodeBlock.code', sync);
		store.unsubscribe('compiler.compiledModules', sync);
		cleanupInputs();
		if (midiAccess) {
			midiAccess.onstatechange = previousStateChangeHandler;
		}
		setErrors([]);
		setMidiInfo(undefined);
	};
}
