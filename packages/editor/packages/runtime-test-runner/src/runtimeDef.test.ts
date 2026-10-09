import type { EventDispatcher, State } from '@8f4e/editor-core';
import createStateManager from '@8f4e/state-manager';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestRuntimeDef } from './runtimeDef';
import type { TestRunResult, TestRuntimeProgram } from './types';

class FakeWorker {
	static instances: FakeWorker[] = [];
	postMessage = vi.fn();
	terminate = vi.fn();
	onmessage: ((event: MessageEvent<TestRunResult>) => void) | null = null;
	onerror: ((event: ErrorEvent) => void) | null = null;

	constructor() {
		FakeWorker.instances.push(this);
	}
	emit(data: TestRunResult) {
		this.onmessage?.({ data } as MessageEvent<TestRunResult>);
	}
}

function createProgram(): TestRuntimeProgram {
	return {
		codeBuffer: new Uint8Array([1]),
		assertionSites: [],
		memory: new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }),
	};
}

function setup(initialProgram?: TestRuntimeProgram, isCompiling = false) {
	FakeWorker.instances = [];
	let program = initialProgram;
	const state = { compiler: { isCompiling }, runtime: { values: { other: { retained: true } } } } as unknown as State;
	const store = createStateManager(state);
	const events = { dispatch: vi.fn() } as unknown as EventDispatcher;
	const definition = createTestRuntimeDef(
		() => program?.codeBuffer ?? new Uint8Array(),
		() => program?.memory ?? null,
		() => program?.assertionSites,
		FakeWorker as unknown as new () => Worker
	);
	const dispose = definition.factory(store, events);
	return {
		state,
		store,
		events,
		dispose,
		setProgram: (value?: TestRuntimeProgram) => {
			program = value;
		},
	};
}

const passed = (): TestRunResult => ({
	status: 'passed',
	assertions: [],
	failures: [],
});

describe('TestRuntime lifecycle', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('runs the latest successful compilation on selection and once after each recompile', () => {
		vi.spyOn(console, 'info').mockImplementation(() => {});
		const firstProgram = createProgram();
		const { state, store, setProgram, dispose } = setup(firstProgram);
		const firstWorker = FakeWorker.instances[0];
		expect(firstWorker.postMessage).toHaveBeenCalledExactlyOnceWith(firstProgram);
		firstWorker.emit(passed());
		expect(firstWorker.terminate).toHaveBeenCalledOnce();
		expect(state.runtime.values.TestRuntime).toMatchObject({ status: 'passed', assertionSites: [] });
		expect(state.runtime.values.other).toEqual({ retained: true });
		setProgram();
		store.set('compiler.isCompiling', true);
		const secondProgram = createProgram();
		setProgram(secondProgram);
		store.set('compiler.isCompiling', false);
		expect(FakeWorker.instances).toHaveLength(2);
		expect(FakeWorker.instances[1].postMessage).toHaveBeenCalledExactlyOnceWith(secondProgram);
		dispose();
	});

	it('waits for compilation and skips attempts without a current test program', () => {
		const { store, state, setProgram, dispose } = setup(createProgram(), true);
		expect(FakeWorker.instances).toHaveLength(0);
		setProgram();
		store.set('compiler.isCompiling', false);
		expect(FakeWorker.instances).toHaveLength(0);
		store.set('compiler.isCompiling', false);
		expect(FakeWorker.instances).toHaveLength(0);
		expect(state.runtime.values.TestRuntime).toEqual({ status: 'idle' });
		dispose();
	});

	it('terminates superseded runs and ignores their delayed results', () => {
		const { store, state, setProgram, dispose } = setup(createProgram());
		const firstWorker = FakeWorker.instances[0];
		const oldListener = firstWorker.onmessage!;
		setProgram();
		store.set('compiler.isCompiling', true);
		expect(firstWorker.terminate).toHaveBeenCalledOnce();
		setProgram(createProgram());
		store.set('compiler.isCompiling', false);
		oldListener({ data: passed() } as MessageEvent<TestRunResult>);
		expect(state.runtime.values.TestRuntime).toMatchObject({ status: 'running' });
		dispose();
	});

	it('publishes runtime errors and stops responding after disposal', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const { store, state, events, setProgram, dispose } = setup(createProgram());
		const worker = FakeWorker.instances[0];
		worker.emit({ status: 'error', error: 'integer divide by zero' });
		expect(state.runtime.values.TestRuntime).toMatchObject({ status: 'error' });
		expect(events.dispatch).toHaveBeenCalledWith('runtimeInitialized');
		dispose();
		setProgram(createProgram());
		store.set('compiler.isCompiling', false);
		expect(FakeWorker.instances).toHaveLength(1);
		expect(state.runtime.values.TestRuntime).toEqual({ status: 'idle' });
	});

	it('reports worker loading errors and terminates the failed worker', () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const { state, dispose } = setup(createProgram());
		const worker = FakeWorker.instances[0];
		worker.onerror!({ message: 'Worker script failed to load' } as ErrorEvent);
		expect(state.runtime.values.TestRuntime).toMatchObject({
			status: 'error',
			error: 'Worker script failed to load',
		});
		expect(worker.terminate).toHaveBeenCalledOnce();
		dispose();
	});
});
