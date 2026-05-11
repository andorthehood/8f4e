import { describe, expect, it, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import createMidiIn from './midiIn';

import type { CodeBlockGraphicData, ParsedDirectiveRecord, State } from '@8f4e/editor-state-types';

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
}

describe('createMidiIn', () => {
	it('fans one MIDI input event out to every callback bound to the port', async () => {
		const onNote = vi.fn();
		const onPitchBend = vi.fn();
		const input = createMIDIInputMock();
		const setErrors = vi.fn();
		const store = createStore([
			codeBlock('foo', [midiInDirective(['0', 'onNote']), midiInDirective(['0', 'onPitchBend'])]),
		]);

		const manager = createMidiIn({
			store,
			setErrors,
			getInputPort: port => (port === '0' ? (input as unknown as MIDIInput) : undefined),
			getWasmMemory: () => new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }),
			getCodeBuffer: () => new Uint8Array([1, 2, 3]),
			instantiateModule: () => ({
				onNote,
				onPitchBend,
			}),
		});

		await flushPromises();
		input.dispatchMidiMessage([0x90, 64, 127]);

		expect(onNote).toHaveBeenCalledWith(0x90, 64, 127);
		expect(onPitchBend).toHaveBeenCalledWith(0x90, 64, 127);
		expect(setErrors).toHaveBeenLastCalledWith([]);

		manager.dispose();
	});

	it('defaults missing MIDI data bytes to zero', async () => {
		const onClock = vi.fn();
		const input = createMIDIInputMock();
		const store = createStore([codeBlock('foo', [midiInDirective(['0', 'onClock'])])]);

		const manager = createMidiIn({
			store,
			setErrors: vi.fn(),
			getInputPort: () => input as unknown as MIDIInput,
			getWasmMemory: () => new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }),
			getCodeBuffer: () => new Uint8Array([1, 2, 3]),
			instantiateModule: () => ({
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
			codeBlock('foo', [midiInDirective(['0', 'missingExport']), midiInDirective(['1', 'onMidiIn'])]),
		]);

		const manager = createMidiIn({
			store,
			setErrors,
			getInputPort: port => (port === '0' ? (input as unknown as MIDIInput) : undefined),
			getWasmMemory: () => new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }),
			getCodeBuffer: () => new Uint8Array([1, 2, 3]),
			instantiateModule: () => ({
				onMidiIn: vi.fn(),
			}),
		});

		await flushPromises();

		expect(input.addEventListener).not.toHaveBeenCalled();
		expect(setErrors).toHaveBeenLastCalledWith([
			expect.objectContaining({
				message: 'Missing callable WebAssembly export for @midiIn callback "missingExport".',
			}),
			expect.objectContaining({
				message: 'MIDI input port "1" is not available.',
			}),
		]);

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
		const store = createStore([codeBlock('foo', [midiInDirective(['0', 'broken']), midiInDirective(['0', 'later'])])]);

		const manager = createMidiIn({
			store,
			setErrors,
			getInputPort: () => input as unknown as MIDIInput,
			getWasmMemory: () => new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }),
			getCodeBuffer: () => new Uint8Array([1, 2, 3]),
			instantiateModule: () => ({
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
