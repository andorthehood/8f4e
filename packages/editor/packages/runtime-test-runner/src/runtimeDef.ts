import type { EventDispatcher, RuntimeRegistryEntry, State } from '@8f4e/editor-core';
import type { AssertionSite } from '@8f4e/language-spec';
import type { StateManager } from '@8f4e/state-manager';
import { formatTestFailures } from '@8f4e/test-runner';
import type { TestRunResult, TestRuntimeState } from './types';

const TEST_RUNTIME_ID = 'TestRuntime';

export function createTestRuntimeDef(
	getCodeBuffer: () => Uint8Array,
	getMemory: () => WebAssembly.Memory | null,
	getAssertionSites: () => AssertionSite[] | undefined,
	WorkerConstructor: new () => Worker
): RuntimeRegistryEntry {
	return {
		id: TEST_RUNTIME_ID,
		factory: (store: StateManager<State>, events: EventDispatcher) => {
			const state = store.getState();
			let worker: Worker | undefined;

			function publish(result: TestRuntimeState) {
				store.set('runtime.values', { ...state.runtime.values, [TEST_RUNTIME_ID]: result });
				store.set(
					'assertionResults',
					result.status === 'passed' || result.status === 'failed'
						? result.assertions.map(({ site, passed }) => ({ site, passed }))
						: []
				);
			}

			function stopWorker() {
				worker?.terminate();
				worker = undefined;
			}

			function syncCompilation() {
				if (state.compiler.isCompiling) {
					stopWorker();
					publish({ status: 'idle' });
					return;
				}

				const memory = getMemory();
				const assertionSites = getAssertionSites();
				if (!memory || !assertionSites) {
					publish({ status: 'idle' });
					return;
				}
				stopWorker();
				const currentWorker = new WorkerConstructor();
				worker = currentWorker;
				publish({ status: 'running', assertionSites });

				const finish = (data: TestRunResult) => {
					if (worker !== currentWorker) return;
					stopWorker();
					publish({ ...data, assertionSites });
					if (data.status === 'error') console.error('[TestRuntime]', data.error);
					else if (data.status === 'failed') console.error('[TestRuntime]', formatTestFailures(data.failures));
					else console.info(`[TestRuntime] ${data.assertions.length} assertions passed`);
					events.dispatch('runtimeInitialized');
				};
				currentWorker.onmessage = ({ data }: MessageEvent<TestRunResult>) => finish(data);
				currentWorker.onerror = event => finish({ status: 'error', error: event.message });
				currentWorker.postMessage({ codeBuffer: getCodeBuffer(), memory, assertionSites });
			}

			store.subscribe('compiler.isCompiling', syncCompilation);
			syncCompilation();

			return () => {
				store.unsubscribe('compiler.isCompiling', syncCompilation);
				stopWorker();
				publish({ status: 'idle' });
			};
		},
	};
}
