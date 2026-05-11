import { describe, expect, it, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import createMidiIn from './midiIn';

import type { CodeBlockGraphicData, ParsedDirectiveRecord, State } from '@8f4e/editor-state-types';
import type { EditorEnvironmentPluginContext } from '../types';

interface MIDIInputMock {
	addEventListener: ReturnType<typeof vi.fn>;
	removeEventListener: ReturnType<typeof vi.fn>;
	dispatchMidiMessage: (data: number[]) => void;
}

function midiInDirective(args: string[], rawRow = 0): ParsedDirectiveRecord {
	return {
		prefix: '@',
		name: 'midiIn',
		args,
		rawRow,
		sourceLine: `; @midiIn ${args.join(' ')}`,
		isTrailing: false,
	};
}

function codeBlock(id: string, directives: ParsedDirectiveRecord[]): CodeBlockGraphicData {
	return {
		id,
		blockType: 'module',
		parsedDirectives: directives,
	} as unknown as CodeBlockGraphicData;
}

function createStore(blocks: CodeBlockGraphicData[]) {
	return createStateManager({
		graphicHelper: {
			codeBlocks: blocks,
		},
		compiler: {
			isCompiling: false,
		},
	} as unknown as State);
}

function createMIDIInputMock(): MIDIInputMock {
	const listeners = new Set<(event: unknown) => void>();

	return {
		addEventListener: vi.fn((type: string, listener: (event: unknown) => void) => {
			if (type === 'midimessage') {
				listeners.add(listener);
			}
		}),
		removeEventListener: vi.fn((type: string, listener: (event: unknown) => void) => {
			if (type === 'midimessage') {
				listeners.delete(listener);
			}
		}),
		dispatchMidiMessage: (data: number[]) => {
			for (const listener of listeners) {
				listener({ data });
			}
		},
	};
}

async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

function createGetWasmExports(
	exports: Record<string, (...args: number[]) => unknown>
): EditorEnvironmentPluginContext['services']['getWasmExports'] {
	return vi.fn(async () => ({
		getExports: vi.fn(async () => exports as WebAssembly.Exports),
		invalidate: vi.fn(),
	}));
}

describe('createMidiIn', () => {
	it('fans one MIDI input event out to every callback bound to the port', async () => {
		const onNote = vi.fn();
		const onPitchBend = vi.fn();
		const input = createMIDIInputMock();
		const setErrors = vi.fn();
		const getInputPort = vi.fn(port => (port === 'input-a' ? (input as unknown as MIDIInput) : undefined));
		const store = createStore([
			codeBlock('foo', [midiInDirective(['input-a', 'onNote']), midiInDirective(['input-a', 'onPitchBend'])]),
		]);

		const manager = createMidiIn({
			store,
			setErrors,
			getInputPort,
			getWasmExports: createGetWasmExports({
				onNote,
				onPitchBend,
			}),
		});

		await flushPromises();
		input.dispatchMidiMessage([0x90, 64, 127]);

		expect(onNote).toHaveBeenCalledWith(0x90, 64, 127);
		expect(onPitchBend).toHaveBeenCalledWith(0x90, 64, 127);
		expect(setErrors).toHaveBeenLastCalledWith([]);
		expect(getInputPort).toHaveBeenCalledTimes(1);

		manager.dispose();
	});

	it('defaults missing MIDI data bytes to zero', async () => {
		const onClock = vi.fn();
		const input = createMIDIInputMock();
		const store = createStore([codeBlock('foo', [midiInDirective(['input-a', 'onClock'])])]);

		const manager = createMidiIn({
			store,
			setErrors: vi.fn(),
			getInputPort: () => input as unknown as MIDIInput,
			getWasmExports: createGetWasmExports({
				onClock,
			}),
		});

		await flushPromises();
		input.dispatchMidiMessage([0xf8]);

		expect(onClock).toHaveBeenCalledWith(0xf8, 0, 0);

		manager.dispose();
	});

	it('reports missing ports and missing callback exports without attaching listeners', async () => {
		const setErrors = vi.fn();
		const input = createMIDIInputMock();
		const store = createStore([
			codeBlock('foo', [midiInDirective(['input-a', 'missingExport']), midiInDirective(['input-b', 'onMidiIn'])]),
		]);

		const manager = createMidiIn({
			store,
			setErrors,
			getInputPort: port => (port === 'input-a' ? (input as unknown as MIDIInput) : undefined),
			getWasmExports: createGetWasmExports({
				onMidiIn: vi.fn(),
			}),
		});

		await flushPromises();

		expect(input.addEventListener).not.toHaveBeenCalled();
		expect(setErrors).toHaveBeenLastCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					message: 'Missing callable WebAssembly export for @midiIn callback "missingExport".',
				}),
				expect.objectContaining({
					message: 'MIDI input port "input-b" is not available.',
				}),
			])
		);

		manager.dispose();
	});

	it('reports missing ports without waiting for WebAssembly exports', async () => {
		const setErrors = vi.fn();
		const getWasmExports = vi.fn();
		const store = createStore([codeBlock('foo', [midiInDirective(['missing-input', 'onMidiIn'])])]);

		const manager = createMidiIn({
			store,
			setErrors,
			getInputPort: () => undefined,
			getWasmExports,
		});

		expect(setErrors).toHaveBeenLastCalledWith([
			expect.objectContaining({
				message: 'MIDI input port "missing-input" is not available.',
			}),
		]);
		expect(getWasmExports).not.toHaveBeenCalled();

		manager.dispose();
	});

	it('continues calling later callbacks when one callback throws', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const broken = vi.fn(() => {
			throw new Error('nope');
		});
		const later = vi.fn();
		const setErrors = vi.fn();
		const input = createMIDIInputMock();
		const store = createStore([
			codeBlock('foo', [midiInDirective(['input-a', 'broken']), midiInDirective(['input-a', 'later'])]),
		]);

		const manager = createMidiIn({
			store,
			setErrors,
			getInputPort: () => input as unknown as MIDIInput,
			getWasmExports: createGetWasmExports({
				broken,
				later,
			}),
		});

		await flushPromises();
		input.dispatchMidiMessage([0xb0, 1, 2]);

		expect(broken).toHaveBeenCalledWith(0xb0, 1, 2);
		expect(later).toHaveBeenCalledWith(0xb0, 1, 2);
		expect(setErrors).toHaveBeenLastCalledWith([
			expect.objectContaining({
				message: 'MIDI input callback "broken" failed.',
			}),
		]);

		manager.dispose();
		consoleError.mockRestore();
	});
});
