import { describe, expect, it, vi } from 'vitest';

import { createWebWorkerRuntimeDef, webWorkerRuntimeFactory } from './runtimeDef';

describe('WebWorker runtime config', () => {
	it('requires a positive sample rate', () => {
		const runtimeDef = createWebWorkerRuntimeDef(
			() => new Uint8Array(),
			() => null,
			class {} as unknown as new () => Worker
		);

		expect(runtimeDef.editorConfigSchema?.schema.properties).toMatchObject({
			sampleRate: { type: 'number', minimum: 1 },
		});
	});
});

describe('WebWorker runtime synchronization', () => {
	it('only sends values consumed by the runtime worker', () => {
		const postMessage = vi.fn();
		const memory = new WebAssembly.Memory({ initial: 1 });
		const codeBuffer = new Uint8Array([1, 2, 3]);
		const store = {
			getState: () => ({
				editorConfig: { workerRuntime: { sampleRate: 100 } },
				compiler: { compiledModules: { unused: {} } },
				info: {},
			}),
			subscribe: vi.fn(),
			subscribeToValue: vi.fn(),
			unsubscribe: vi.fn(),
		} as unknown as Parameters<typeof webWorkerRuntimeFactory>[0];
		const events = {
			dispatch: vi.fn(),
		} as unknown as Parameters<typeof webWorkerRuntimeFactory>[1];
		class WorkerStub {
			postMessage = postMessage;
			addEventListener = vi.fn();
			removeEventListener = vi.fn();
			terminate = vi.fn();
		}

		const dispose = webWorkerRuntimeFactory(
			store,
			events,
			() => codeBuffer,
			() => memory,
			WorkerStub as unknown as new () => Worker
		);

		expect(postMessage).toHaveBeenCalledWith({
			type: 'init',
			payload: {
				memoryRef: memory,
				sampleRate: 100,
				codeBuffer,
			},
		});

		dispose();
	});
});
