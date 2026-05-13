import { describe, expect, it, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import createSerialIn from './serialIn';

import type { CodeBlockGraphicData, ParsedDirectiveRecord, State } from '@8f4e/editor-state-types';
import type { MemoryViews } from '@8f4e/web-ui';
import type { DataStructure } from '@8f4e/compiler-spec';
import type { EditorEnvironmentPluginContext } from '../types';
import type { SerialPortLike } from './types';

interface SerialPortMock extends SerialPortLike {
	close: ReturnType<typeof vi.fn>;
	enqueue: (data: number[]) => void;
}

function directive(name: string, args: string[], rawRow = 0): ParsedDirectiveRecord {
	return {
		prefix: '@',
		name,
		args,
		rawRow,
		sourceLine: `; @${name} ${args.join(' ')}`,
		isTrailing: false,
	};
}

function codeBlock(id: string, directives: ParsedDirectiveRecord[]): CodeBlockGraphicData {
	return {
		id,
		moduleId: id,
		blockType: 'module',
		parsedDirectives: directives,
	} as unknown as CodeBlockGraphicData;
}

function createMemory(byteAddress = 8): DataStructure {
	return {
		id: 'serialBuffer',
		type: 'int8*',
		numberOfElements: 16,
		elementWordSize: 1,
		byteAddress,
		wordAlignedAddress: byteAddress / 4,
		wordAlignedSize: 4,
		default: 0,
		isInteger: true,
		isPointingToPointer: false,
		isUnsigned: false,
	} as DataStructure;
}

function createStore(blocks: CodeBlockGraphicData[]) {
	return createStateManager({
		graphicHelper: {
			codeBlocks: blocks,
		},
		compiler: {
			isCompiling: false,
			compiledModules: {
				foo: {
					memoryMap: {
						serialBuffer: createMemory(),
					},
				},
			},
		},
	} as unknown as State);
}

function createMemoryViews(): MemoryViews {
	return {
		uint8: new Uint8Array(64),
		int8: new Int8Array(64),
		int16: new Int16Array(32),
		uint16: new Uint16Array(32),
		int32: new Int32Array(16),
		float32: new Float32Array(16),
		float64: new Float64Array(8),
	};
}

function createSerialPortMock(): SerialPortMock {
	let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
	const stream = new ReadableStream<Uint8Array>({
		start: activeController => {
			controller = activeController;
		},
		cancel: () => {},
	});

	return {
		readable: stream,
		open: vi.fn(async () => {}),
		close: vi.fn(async () => {}),
		enqueue: (data: number[]) => {
			controller?.enqueue(new Uint8Array(data));
		},
	};
}

async function flushPromises(): Promise<void> {
	for (let index = 0; index < 8; index++) {
		await Promise.resolve();
	}
}

function createGetWasmExports(
	exports: Record<string, (ptr: number, length: number) => unknown>
): EditorEnvironmentPluginContext['services']['getWasmExports'] {
	return vi.fn(async () => ({
		getExports: vi.fn(async () => exports as WebAssembly.Exports),
		invalidate: vi.fn(),
	}));
}

describe('createSerialIn', () => {
	it('frames arbitrary serial chunks and fans completed frames out to callbacks', async () => {
		const onSerialFrame = vi.fn();
		const onSerialDebug = vi.fn();
		const port = createSerialPortMock();
		const memoryViews = createMemoryViews();
		const setErrors = vi.fn();
		const store = createStore([
			codeBlock('foo', [
				directive('serialIn', ['0', '115200', 'serialBuffer', '4']),
				directive('serialInCallback', ['0', 'onSerialFrame']),
				directive('serialInCallback', ['0', 'onSerialDebug']),
			]),
		]);

		const manager = createSerialIn({
			store,
			memoryViews,
			setErrors,
			getPort: portIndex => (portIndex === '0' ? port : undefined),
			getWasmExports: createGetWasmExports({
				onSerialFrame,
				onSerialDebug,
			}),
		});

		await flushPromises();
		port.enqueue([1, 2]);
		await flushPromises();
		expect(onSerialFrame).not.toHaveBeenCalled();

		port.enqueue([3, 4, 5, 6, 7]);
		await flushPromises();

		expect(port.open).toHaveBeenCalledWith({ baudRate: 115200 });
		expect(memoryViews.uint8.slice(8, 12)).toEqual(new Uint8Array([1, 2, 3, 4]));
		expect(onSerialFrame).toHaveBeenCalledWith(8, 4);
		expect(onSerialDebug).toHaveBeenCalledWith(8, 4);
		expect(setErrors).toHaveBeenLastCalledWith([]);

		port.enqueue([8]);
		await flushPromises();

		expect(memoryViews.uint8.slice(8, 12)).toEqual(new Uint8Array([5, 6, 7, 8]));
		expect(onSerialFrame).toHaveBeenCalledTimes(2);

		manager.dispose();
	});

	it('reports missing ports, missing buffers, and missing callback exports', async () => {
		const setErrors = vi.fn();
		const port = createSerialPortMock();
		const store = createStore([
			codeBlock('foo', [
				directive('serialIn', ['0', '115200', 'missingBuffer', '4']),
				directive('serialInCallback', ['0', 'missingExport']),
				directive('serialIn', ['1', '115200', 'serialBuffer', '4']),
				directive('serialInCallback', ['1', 'onSerialFrame']),
			]),
		]);

		const manager = createSerialIn({
			store,
			memoryViews: createMemoryViews(),
			setErrors,
			getPort: portIndex => (portIndex === '0' ? port : undefined),
			getWasmExports: createGetWasmExports({
				onSerialFrame: vi.fn(),
			}),
		});

		await flushPromises();

		expect(setErrors).toHaveBeenLastCalledWith(
			expect.arrayContaining([
				expect.objectContaining({
					message: 'Missing callable WebAssembly export for @serialInCallback "missingExport".',
				}),
				expect.objectContaining({
					message: 'Serial input buffer "missingBuffer" is not available.',
				}),
				expect.objectContaining({
					message: 'Serial input port "1" is not available.',
				}),
			])
		);

		manager.dispose();
	});

	it('clears queued partial frames when serial input resyncs', async () => {
		const onSerialFrame = vi.fn();
		const firstPort = createSerialPortMock();
		const secondPort = createSerialPortMock();
		let activePort = firstPort;
		const memoryViews = createMemoryViews();
		const store = createStore([
			codeBlock('foo', [
				directive('serialIn', ['0', '115200', 'serialBuffer', '4']),
				directive('serialInCallback', ['0', 'onSerialFrame']),
			]),
		]);

		const manager = createSerialIn({
			store,
			memoryViews,
			setErrors: vi.fn(),
			getPort: () => activePort,
			getWasmExports: createGetWasmExports({
				onSerialFrame,
			}),
		});

		await flushPromises();
		firstPort.enqueue([1, 2]);
		await flushPromises();
		expect(onSerialFrame).not.toHaveBeenCalled();

		activePort = secondPort;
		store.set('compiler.compiledModules', {
			foo: {
				memoryMap: {
					serialBuffer: createMemory(),
				},
			},
		});
		await flushPromises();

		secondPort.enqueue([3, 4]);
		await flushPromises();
		expect(onSerialFrame).not.toHaveBeenCalled();

		secondPort.enqueue([5, 6]);
		await flushPromises();

		expect(firstPort.close).toHaveBeenCalled();
		expect(memoryViews.uint8.slice(8, 12)).toEqual(new Uint8Array([3, 4, 5, 6]));
		expect(onSerialFrame).toHaveBeenCalledTimes(1);

		manager.dispose();
	});

	it('continues calling later callbacks when one callback throws', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const broken = vi.fn(() => {
			throw new Error('nope');
		});
		const later = vi.fn();
		const setErrors = vi.fn();
		const port = createSerialPortMock();
		const store = createStore([
			codeBlock('foo', [
				directive('serialIn', ['0', '115200', 'serialBuffer', '2']),
				directive('serialInCallback', ['0', 'broken']),
				directive('serialInCallback', ['0', 'later']),
			]),
		]);

		const manager = createSerialIn({
			store,
			memoryViews: createMemoryViews(),
			setErrors,
			getPort: () => port,
			getWasmExports: createGetWasmExports({
				broken,
				later,
			}),
		});

		await flushPromises();
		port.enqueue([1, 2]);
		await flushPromises();

		expect(broken).toHaveBeenCalledWith(8, 2);
		expect(later).toHaveBeenCalledWith(8, 2);
		expect(setErrors).toHaveBeenLastCalledWith([
			expect.objectContaining({
				message: 'Serial input callback "broken" failed.',
			}),
		]);

		manager.dispose();
		consoleError.mockRestore();
	});
});
