import type { Editor } from '@8f4e/editor-core';
import type { CompileProjectOptions, ProjectObjectModel } from '@8f4e/language-spec';
import { describe, expect, it, vi } from 'vitest';
import { createCompilerService } from './compiler-callback';

type MessageListener = (event: MessageEvent) => void;

class FakeWorker {
	readonly postedMessages: unknown[] = [];
	readonly terminate = vi.fn();
	private readonly messageListeners = new Set<MessageListener>();

	addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
		if (type === 'message' && typeof listener === 'function') {
			this.messageListeners.add(listener as MessageListener);
		}
	}

	removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
		if (type === 'message' && typeof listener === 'function') {
			this.messageListeners.delete(listener as MessageListener);
		}
	}

	postMessage(message: unknown): void {
		this.postedMessages.push(message);
	}

	emitMessage(data: unknown): void {
		for (const listener of this.messageListeners) {
			listener({ data } as MessageEvent);
		}
	}
}

function createEditor() {
	return {
		updateMemoryViews: vi.fn(),
	} as unknown as Editor;
}

function createSuccessMessage(codeBuffer: Uint8Array, wasmMemory: WebAssembly.Memory) {
	return {
		type: 'success',
		compilationId: 0,
		payload: {
			wasmMemory,
			codeBuffer,
			compiledModules: [],
			memoryPlan: {},
			memoryDefaultsByModuleId: {},
			pointerMetadataByModuleId: {},
			projectMemoryExposuresByGroupPath: {},
			requiredMemoryBytes: 0,
			allocatedMemoryBytes: 0,
			astCacheStats: {},
			hasWasmInstanceBeenReset: false,
			memoryAction: 'none',
			compiledFunctions: [],
			initOnlyReran: false,
		},
	};
}

describe('compiler service', () => {
	it('isolates workers, include resolution, memory, and code buffers between instances', async () => {
		const workers: FakeWorker[] = [];
		const createWorker = () => {
			const worker = new FakeWorker();
			workers.push(worker);
			return worker as unknown as Worker;
		};
		const firstService = createCompilerService(createWorker);
		const secondService = createCompilerService(createWorker);
		const firstEditor = createEditor();
		const secondEditor = createEditor();
		const firstMemory = new WebAssembly.Memory({ initial: 1 });
		const secondMemory = new WebAssembly.Memory({ initial: 1 });
		const firstCodeBuffer = new Uint8Array([1, 2, 3]);
		const secondCodeBuffer = new Uint8Array([4, 5]);
		const project = {} as ProjectObjectModel;

		const firstCompilation = firstService.compileCode(
			project,
			{ resolveInclude: includeId => `first:${includeId}` } as CompileProjectOptions,
			firstEditor
		);
		const secondCompilation = secondService.compileCode(
			project,
			{ resolveInclude: includeId => `second:${includeId}` } as CompileProjectOptions,
			secondEditor
		);

		expect(workers).toHaveLength(2);

		workers[0].emitMessage({ type: 'resolveInclude', payload: { requestId: 10, includeId: 'module' } });
		workers[1].emitMessage({ type: 'resolveInclude', payload: { requestId: 20, includeId: 'module' } });
		await vi.waitFor(() => {
			expect(workers[0].postedMessages).toContainEqual({
				type: 'resolveIncludeResult',
				payload: { requestId: 10, source: 'first:module' },
			});
			expect(workers[1].postedMessages).toContainEqual({
				type: 'resolveIncludeResult',
				payload: { requestId: 20, source: 'second:module' },
			});
		});

		workers[0].emitMessage(createSuccessMessage(firstCodeBuffer, firstMemory));
		workers[1].emitMessage(createSuccessMessage(secondCodeBuffer, secondMemory));
		await Promise.all([firstCompilation, secondCompilation]);

		expect(firstService.getMemory()).toBe(firstMemory);
		expect(secondService.getMemory()).toBe(secondMemory);
		expect(firstService.getCodeBuffer()).toBe(firstCodeBuffer);
		expect(secondService.getCodeBuffer()).toBe(secondCodeBuffer);
		expect(firstEditor.updateMemoryViews).toHaveBeenCalledWith(firstMemory);
		expect(secondEditor.updateMemoryViews).toHaveBeenCalledWith(secondMemory);

		firstService.dispose();
		expect(workers[0].terminate).toHaveBeenCalledOnce();
		expect(workers[1].terminate).not.toHaveBeenCalled();

		secondService.dispose();
		expect(workers[1].terminate).toHaveBeenCalledOnce();
	});

	it('does not recreate its worker after disposal', async () => {
		const worker = new FakeWorker();
		const service = createCompilerService(() => worker as unknown as Worker);
		service.dispose();

		await expect(
			service.compileCode({} as ProjectObjectModel, {} as CompileProjectOptions, createEditor())
		).rejects.toThrow('Compiler service has been disposed');
		expect(worker.terminate).not.toHaveBeenCalled();
	});

	it('rejects pending compilations when disposed', async () => {
		const worker = new FakeWorker();
		const service = createCompilerService(() => worker as unknown as Worker);
		const compilation = service.compileCode({} as ProjectObjectModel, {} as CompileProjectOptions, createEditor());

		service.dispose();

		await expect(compilation).rejects.toThrow('Compiler service has been disposed');
		expect(worker.terminate).toHaveBeenCalledOnce();
	});
});
