import parseSerialDirectives from './directives';

import type { CodeError, State } from '@8f4e/editor-state-types';
import type { StateManager } from '@8f4e/state-manager';
import type { MemoryViews } from '@8f4e/web-ui';
import type { EditorEnvironmentPluginContext } from '../types';
import type { SerialInCallbackBinding, SerialInPipeline, SerialPortLike, SerialPortLookup } from './types';

type SerialCallback = (ptr: number, length: number) => unknown;

interface SerialBufferTarget {
	byteAddress: number;
}

interface ResolvedSerialPipeline {
	pipeline: SerialInPipeline;
	port: SerialPortLike;
	buffer: SerialBufferTarget;
	callbacks: Array<{
		binding: SerialInCallbackBinding;
		callback: SerialCallback;
	}>;
}

interface ActiveSerialReader {
	port: SerialPortLike;
	reader?: ReadableStreamDefaultReader<Uint8Array>;
	active: boolean;
}

interface SerialInOptions {
	store: StateManager<State>;
	memoryViews: MemoryViews;
	setErrors: EditorEnvironmentPluginContext['setErrors'];
	getPort: SerialPortLookup;
	getWasmExports: EditorEnvironmentPluginContext['services']['getWasmExports'];
}

export interface SerialInManager {
	sync: () => void;
	dispose: () => void;
}

function createPipelineError(pipeline: SerialInPipeline, message: string): CodeError {
	return {
		codeBlockId: pipeline.codeBlockId,
		codeBlockType: pipeline.codeBlockType,
		lineNumber: pipeline.lineNumber,
		message,
	};
}

function createCallbackError(binding: SerialInCallbackBinding, message: string): CodeError {
	return {
		codeBlockId: binding.codeBlockId,
		codeBlockType: binding.codeBlockType,
		lineNumber: binding.lineNumber,
		message,
	};
}

function resolveBufferMemoryId(pipeline: SerialInPipeline): string | undefined {
	if (pipeline.bufferMemoryId.includes(':')) {
		return pipeline.bufferMemoryId;
	}

	if (!pipeline.moduleId) {
		return undefined;
	}

	return `${pipeline.moduleId}:${pipeline.bufferMemoryId}`;
}

function resolveBufferTarget(state: State, pipeline: SerialInPipeline): SerialBufferTarget | undefined {
	const memoryId = resolveBufferMemoryId(pipeline);
	if (!memoryId) {
		return undefined;
	}

	const [moduleId, memoryName] = memoryId.split(':');
	if (!moduleId || !memoryName) {
		return undefined;
	}

	const memory = state.compiler.compiledModules[moduleId]?.memoryMap[memoryName];
	if (!memory) {
		return undefined;
	}

	return { byteAddress: memory.byteAddress };
}

function stopSerialReaders(activeReaders: ActiveSerialReader[]): Promise<void> {
	const readers = activeReaders.splice(0, activeReaders.length);
	return Promise.all(
		readers.map(async activeReader => {
			activeReader.active = false;
			try {
				await activeReader.reader?.cancel();
			} catch {
				// The reader may already be closed after a disconnect.
			}

			try {
				activeReader.reader?.releaseLock();
			} catch {
				// The lock may already be released by the browser.
			}

			try {
				await activeReader.port.close?.();
			} catch {
				// Closing an already-closed serial port is harmless for cleanup.
			}
		})
	).then(() => undefined);
}

function groupCallbacksByPort(
	callbacks: SerialInCallbackBinding[],
	exports: WebAssembly.Exports
): {
	callbacksByPort: Map<string, Array<{ binding: SerialInCallbackBinding; callback: SerialCallback }>>;
	errors: CodeError[];
} {
	const callbacksByPort = new Map<string, Array<{ binding: SerialInCallbackBinding; callback: SerialCallback }>>();
	const errors: CodeError[] = [];

	for (const binding of callbacks) {
		const callback = exports[binding.exportName];
		if (typeof callback !== 'function') {
			errors.push(
				createCallbackError(
					binding,
					`Missing callable WebAssembly export for @serialInCallback "${binding.exportName}".`
				)
			);
			continue;
		}

		const portCallbacks = callbacksByPort.get(binding.port) ?? [];
		portCallbacks.push({ binding, callback: callback as SerialCallback });
		callbacksByPort.set(binding.port, portCallbacks);
	}

	return { callbacksByPort, errors };
}

function resolvePipelines({
	state,
	pipelines,
	callbacksByPort,
	getPort,
}: {
	state: State;
	pipelines: SerialInPipeline[];
	callbacksByPort: Map<string, Array<{ binding: SerialInCallbackBinding; callback: SerialCallback }>>;
	getPort: SerialPortLookup;
}): { resolvedPipelines: ResolvedSerialPipeline[]; errors: CodeError[] } {
	const resolvedPipelines: ResolvedSerialPipeline[] = [];
	const errors: CodeError[] = [];

	for (const pipeline of pipelines) {
		const callbacks = callbacksByPort.get(pipeline.port) ?? [];
		const port = getPort(pipeline.port);
		if (!port) {
			errors.push(createPipelineError(pipeline, `Serial input port "${pipeline.port}" is not available.`));
			continue;
		}

		const buffer = resolveBufferTarget(state, pipeline);
		if (!buffer) {
			errors.push(createPipelineError(pipeline, `Serial input buffer "${pipeline.bufferMemoryId}" is not available.`));
			continue;
		}

		if (callbacks.length > 0) {
			resolvedPipelines.push({ pipeline, port, buffer, callbacks });
		}
	}

	return { resolvedPipelines, errors };
}

function processSerialChunk({
	chunk,
	queue,
	resolvedPipeline,
	memoryViews,
	baseErrors,
	setErrors,
}: {
	chunk: Uint8Array;
	queue: number[];
	resolvedPipeline: ResolvedSerialPipeline;
	memoryViews: MemoryViews;
	baseErrors: CodeError[];
	setErrors: EditorEnvironmentPluginContext['setErrors'];
}): void {
	queue.push(...chunk);

	while (queue.length >= resolvedPipeline.pipeline.frameBytes) {
		const frame = queue.splice(0, resolvedPipeline.pipeline.frameBytes);
		memoryViews.uint8.set(frame, resolvedPipeline.buffer.byteAddress);
		const callbackErrors: CodeError[] = [];

		for (const { binding, callback } of resolvedPipeline.callbacks) {
			try {
				callback(resolvedPipeline.buffer.byteAddress, resolvedPipeline.pipeline.frameBytes);
			} catch (error) {
				console.error('Serial input callback failed:', error);
				callbackErrors.push(createCallbackError(binding, `Serial input callback "${binding.exportName}" failed.`));
			}
		}

		if (callbackErrors.length > 0) {
			setErrors([...baseErrors, ...callbackErrors]);
		}
	}
}

function startSerialReader({
	resolvedPipeline,
	memoryViews,
	activeReaders,
	baseErrors,
	setErrors,
	onReadFailure,
}: {
	resolvedPipeline: ResolvedSerialPipeline;
	memoryViews: MemoryViews;
	activeReaders: ActiveSerialReader[];
	baseErrors: CodeError[];
	setErrors: EditorEnvironmentPluginContext['setErrors'];
	onReadFailure: (pipeline: SerialInPipeline) => void;
}): void {
	const activeReader: ActiveSerialReader = { port: resolvedPipeline.port, active: true };
	activeReaders.push(activeReader);
	const queue: number[] = [];

	void (async () => {
		try {
			await resolvedPipeline.port.open({ baudRate: resolvedPipeline.pipeline.baudRate });
			const reader = resolvedPipeline.port.readable?.getReader();
			if (!reader) {
				throw new Error('Serial port did not expose a readable stream.');
			}

			activeReader.reader = reader;

			while (activeReader.active) {
				const { value, done } = await reader.read();
				if (done) {
					break;
				}

				if (value && value.length > 0) {
					processSerialChunk({
						chunk: value,
						queue,
						resolvedPipeline,
						memoryViews,
						baseErrors,
						setErrors,
					});
				}
			}
		} catch (error) {
			if (!activeReader.active) {
				return;
			}

			console.error('Serial input reader failed:', error);
			queue.length = 0;
			onReadFailure(resolvedPipeline.pipeline);
		}
	})();
}

export default function createSerialIn({
	store,
	memoryViews,
	setErrors,
	getPort,
	getWasmExports,
}: SerialInOptions): SerialInManager {
	const activeReaders: ActiveSerialReader[] = [];
	let disposed = false;
	let syncGeneration = 0;

	function sync(): void {
		if (disposed) {
			return;
		}

		const generation = ++syncGeneration;
		const cleanupPromise = stopSerialReaders(activeReaders);

		const state = store.getState();
		if (state.compiler.isCompiling) {
			setErrors([]);
			return;
		}

		const parsed = parseSerialDirectives(state);
		const errors: CodeError[] = [...parsed.errors];

		if (parsed.pipelines.length === 0 || parsed.callbacks.length === 0) {
			setErrors(errors);
			return;
		}

		void getWasmExports()
			.then(wasmExports => wasmExports.getExports())
			.then(async exports => {
				await cleanupPromise;
				if (disposed || generation !== syncGeneration) {
					return;
				}

				if (!exports) {
					setErrors(errors);
					return;
				}

				const groupedCallbacks = groupCallbacksByPort(parsed.callbacks, exports);
				errors.push(...groupedCallbacks.errors);
				const resolved = resolvePipelines({
					state: store.getState(),
					pipelines: parsed.pipelines,
					callbacksByPort: groupedCallbacks.callbacksByPort,
					getPort,
				});
				errors.push(...resolved.errors);

				for (const resolvedPipeline of resolved.resolvedPipelines) {
					startSerialReader({
						resolvedPipeline,
						memoryViews,
						activeReaders,
						baseErrors: errors,
						setErrors,
						onReadFailure: pipeline => {
							if (disposed || generation !== syncGeneration) {
								return;
							}

							setErrors([
								...errors,
								createPipelineError(pipeline, `Serial input port "${pipeline.port}" is not available.`),
							]);
						},
					});
				}

				setErrors(errors);
			})
			.catch(error => {
				if (disposed || generation !== syncGeneration) {
					return;
				}

				console.error('Failed to instantiate serial input WebAssembly module:', error);
				setErrors(errors);
			});
	}

	store.subscribe('graphicHelper.codeBlocks', sync);
	store.subscribe('graphicHelper.selectedCodeBlock.code', sync);
	store.subscribe('compiler.isCompiling', sync);
	store.subscribe('compiler.compiledModules', sync);
	sync();

	return {
		sync,
		dispose: () => {
			disposed = true;
			syncGeneration++;
			void stopSerialReaders(activeReaders);
			store.unsubscribe('graphicHelper.codeBlocks', sync);
			store.unsubscribe('graphicHelper.selectedCodeBlock.code', sync);
			store.unsubscribe('compiler.isCompiling', sync);
			store.unsubscribe('compiler.compiledModules', sync);
		},
	};
}
