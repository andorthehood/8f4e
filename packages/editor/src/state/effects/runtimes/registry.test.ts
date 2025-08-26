import { getAvailableRuntimes, getRuntimeMetadata, RuntimeType } from './registry';

describe('Runtime Registry', () => {
	describe('getAvailableRuntimes', () => {
		test('should return all available runtime types', () => {
			const runtimes = getAvailableRuntimes();
			expect(runtimes).toEqual(['AudioWorkletRuntime', 'WebWorkerMIDIRuntime', 'WebWorkerLogicRuntime']);
		});
	});

	describe('getRuntimeMetadata', () => {
		test('should return metadata for AudioWorkletRuntime', () => {
			const metadata = getRuntimeMetadata('AudioWorkletRuntime');
			expect(metadata).toBeDefined();
			expect(metadata?.name).toBe('Audio Worklet Runtime');
			expect(metadata?.description).toBe('Real-time audio processing using AudioWorklet API');
			expect(typeof metadata?.loader).toBe('function');
		});

		test('should return metadata for WebWorkerMIDIRuntime', () => {
			const metadata = getRuntimeMetadata('WebWorkerMIDIRuntime');
			expect(metadata).toBeDefined();
			expect(metadata?.name).toBe('Web Worker MIDI Runtime');
			expect(metadata?.description).toBe('MIDI processing using Web Workers');
			expect(typeof metadata?.loader).toBe('function');
		});

		test('should return metadata for WebWorkerLogicRuntime', () => {
			const metadata = getRuntimeMetadata('WebWorkerLogicRuntime');
			expect(metadata).toBeDefined();
			expect(metadata?.name).toBe('Web Worker Logic Runtime');
			expect(metadata?.description).toBe('General purpose logic processing using Web Workers');
			expect(typeof metadata?.loader).toBe('function');
		});

		test('should return undefined for unknown runtime', () => {
			const metadata = getRuntimeMetadata('UnknownRuntime' as RuntimeType);
			expect(metadata).toBeUndefined();
		});
	});
});
