import { RuntimeType } from './runtime';

describe('Runtime System', () => {
	describe('RuntimeType', () => {
		test('should support AudioWorkletRuntime type', () => {
			const runtimeType: RuntimeType = 'AudioWorkletRuntime';
			expect(runtimeType).toBe('AudioWorkletRuntime');
		});

		test('should support WebWorkerMIDIRuntime type', () => {
			const runtimeType: RuntimeType = 'WebWorkerMIDIRuntime';
			expect(runtimeType).toBe('WebWorkerMIDIRuntime');
		});

		test('should support WebWorkerLogicRuntime type', () => {
			const runtimeType: RuntimeType = 'WebWorkerLogicRuntime';
			expect(runtimeType).toBe('WebWorkerLogicRuntime');
		});

		test('should support MainThreadLogicRuntime type', () => {
			const runtimeType: RuntimeType = 'MainThreadLogicRuntime';
			expect(runtimeType).toBe('MainThreadLogicRuntime');
		});
	});

	describe('Runtime loading integration', () => {
		test('should have access to runtime types from main module', () => {
			// This test ensures the types are properly exported from the main runtime module
			const validRuntimeTypes: RuntimeType[] = ['AudioWorkletRuntime', 'WebWorkerMIDIRuntime', 'WebWorkerLogicRuntime', 'MainThreadLogicRuntime'];

			expect(validRuntimeTypes).toHaveLength(4);
			expect(validRuntimeTypes).toContain('AudioWorkletRuntime');
			expect(validRuntimeTypes).toContain('WebWorkerMIDIRuntime');
			expect(validRuntimeTypes).toContain('WebWorkerLogicRuntime');
			expect(validRuntimeTypes).toContain('MainThreadLogicRuntime');
		});
	});
});
