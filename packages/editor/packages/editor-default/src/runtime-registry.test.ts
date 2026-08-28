import { describe, expect, it, vi } from 'vitest';
import { createRuntimeRegistry } from './runtime-registry';

function createCompilerArtifactsStub() {
	return {
		getMemory: vi.fn(() => null),
		getCodeBuffer: vi.fn(() => new Uint8Array()),
	};
}

describe('runtime registry', () => {
	it('creates independent lazy runtime entries for each editor instance', () => {
		const firstRegistry = createRuntimeRegistry(createCompilerArtifactsStub());
		const secondRegistry = createRuntimeRegistry(createCompilerArtifactsStub());

		expect(firstRegistry).not.toBe(secondRegistry);
		expect(firstRegistry.WebWorkerRuntime).not.toBe(secondRegistry.WebWorkerRuntime);
		expect(firstRegistry.MainThreadRuntime).not.toBe(secondRegistry.MainThreadRuntime);
		expect(firstRegistry.AudioWorkletRuntime).not.toBe(secondRegistry.AudioWorkletRuntime);
	});
});
