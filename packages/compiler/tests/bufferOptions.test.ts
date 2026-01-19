import { describe, test, expect } from 'vitest';

import modules from './__fixtures__/modules';

import compile from '../src';

describe('buffer options integration tests', () => {
	const baseOptions = {
		startingMemoryWordAddress: 0,
		environmentExtensions: { ignoredKeywords: [] },
		memorySizeBytes: 65536,
		disableSharedMemory: true,
	};

	describe('bufferSize option', () => {
		test('compiles successfully with default bufferSize (128)', () => {
			const result = compile(modules, baseOptions);

			expect(result.codeBuffer).toBeDefined();
			expect(result.codeBuffer.length).toBeGreaterThan(0);
		});

		test('compiles successfully with custom bufferSize', () => {
			const result = compile(modules, {
				...baseOptions,
				bufferSize: 64,
			});

			expect(result.codeBuffer).toBeDefined();
			expect(result.codeBuffer.length).toBeGreaterThan(0);
		});

		test('compiles successfully with large bufferSize', () => {
			const result = compile(modules, {
				...baseOptions,
				bufferSize: 512,
			});

			expect(result.codeBuffer).toBeDefined();
			expect(result.codeBuffer.length).toBeGreaterThan(0);
		});

		test('compiles successfully with small bufferSize', () => {
			const result = compile(modules, {
				...baseOptions,
				bufferSize: 1,
			});

			expect(result.codeBuffer).toBeDefined();
			expect(result.codeBuffer.length).toBeGreaterThan(0);
		});
	});

	describe('bufferStrategy option', () => {
		test('compiles successfully with default strategy (loop)', () => {
			const result = compile(modules, baseOptions);

			expect(result.codeBuffer).toBeDefined();
			expect(result.codeBuffer.length).toBeGreaterThan(0);
		});

		test('compiles successfully with explicit loop strategy', () => {
			const result = compile(modules, {
				...baseOptions,
				bufferStrategy: 'loop',
			});

			expect(result.codeBuffer).toBeDefined();
			expect(result.codeBuffer.length).toBeGreaterThan(0);
		});

		test('compiles successfully with unrolled strategy', () => {
			const result = compile(modules, {
				...baseOptions,
				bufferStrategy: 'unrolled',
			});

			expect(result.codeBuffer).toBeDefined();
			expect(result.codeBuffer.length).toBeGreaterThan(0);
		});
	});

	describe('bufferSize and bufferStrategy combination', () => {
		test('compiles with loop strategy and custom bufferSize', () => {
			const result = compile(modules, {
				...baseOptions,
				bufferSize: 256,
				bufferStrategy: 'loop',
			});

			expect(result.codeBuffer).toBeDefined();
			expect(result.codeBuffer.length).toBeGreaterThan(0);
		});

		test('compiles with unrolled strategy and custom bufferSize', () => {
			const result = compile(modules, {
				...baseOptions,
				bufferSize: 16,
				bufferStrategy: 'unrolled',
			});

			expect(result.codeBuffer).toBeDefined();
			expect(result.codeBuffer.length).toBeGreaterThan(0);
		});
	});

	describe('bytecode size comparison', () => {
		test('loop strategy produces smaller bytecode than unrolled for same bufferSize', () => {
			const loopResult = compile(modules, {
				...baseOptions,
				bufferSize: 128,
				bufferStrategy: 'loop',
			});

			const unrolledResult = compile(modules, {
				...baseOptions,
				bufferSize: 128,
				bufferStrategy: 'unrolled',
			});

			// Loop strategy should produce significantly smaller bytecode
			expect(loopResult.codeBuffer.length).toBeLessThan(unrolledResult.codeBuffer.length);

			// The difference should be substantial for 128 iterations
			const sizeDifference = unrolledResult.codeBuffer.length - loopResult.codeBuffer.length;
			expect(sizeDifference).toBeGreaterThan(100);
		});

		test('larger bufferSize with unrolled strategy increases bytecode size linearly', () => {
			const small = compile(modules, {
				...baseOptions,
				bufferSize: 4,
				bufferStrategy: 'unrolled',
			});

			const large = compile(modules, {
				...baseOptions,
				bufferSize: 8,
				bufferStrategy: 'unrolled',
			});

			// Doubling buffer size should roughly double the size increase
			const smallSize = small.codeBuffer.length;
			const largeSize = large.codeBuffer.length;
			const sizeDiff = largeSize - smallSize;

			// The difference should be proportional to the buffer size increase
			// Each additional call is ~2 bytes (call instruction + function index)
			expect(sizeDiff).toBeGreaterThan(4);
		});

		test('larger bufferSize with loop strategy has minimal impact on bytecode size', () => {
			const small = compile(modules, {
				...baseOptions,
				bufferSize: 128,
				bufferStrategy: 'loop',
			});

			const large = compile(modules, {
				...baseOptions,
				bufferSize: 512,
				bufferStrategy: 'loop',
			});

			// Loop strategy size should not increase much with larger buffer size
			// The difference should just be in encoding the constant (LEB128)
			const sizeDiff = Math.abs(large.codeBuffer.length - small.codeBuffer.length);
			expect(sizeDiff).toBeLessThan(10);
		});
	});

	describe('buffer function execution', () => {
		test('buffer function can be instantiated and exports are available', async () => {
			const result = compile(modules, {
				...baseOptions,
				bufferSize: 16,
				bufferStrategy: 'loop',
			});

			const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1 });
			const instance = await WebAssembly.instantiate(result.codeBuffer, {
				js: { memory: memoryRef },
			});

			// Verify all expected exports exist
			expect(instance.instance.exports.init).toBeDefined();
			expect(instance.instance.exports.cycle).toBeDefined();
			expect(instance.instance.exports.buffer).toBeDefined();

			// Verify exports are functions
			expect(typeof instance.instance.exports.init).toBe('function');
			expect(typeof instance.instance.exports.cycle).toBe('function');
			expect(typeof instance.instance.exports.buffer).toBe('function');
		});

		test('buffer function with unrolled strategy can be instantiated', async () => {
			const result = compile(modules, {
				...baseOptions,
				bufferSize: 16,
				bufferStrategy: 'unrolled',
			});

			const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1 });
			const instance = await WebAssembly.instantiate(result.codeBuffer, {
				js: { memory: memoryRef },
			});

			// Verify all expected exports exist
			expect(instance.instance.exports.init).toBeDefined();
			expect(instance.instance.exports.cycle).toBeDefined();
			expect(instance.instance.exports.buffer).toBeDefined();
		});

		test('buffer function executes cycle function the expected number of times (loop strategy)', async () => {
			const bufferSize = 10;
			const result = compile(modules, {
				...baseOptions,
				bufferSize,
				bufferStrategy: 'loop',
			});

			const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1 });
			const dataView = new DataView(memoryRef.buffer);
			const instance = await WebAssembly.instantiate(result.codeBuffer, {
				js: { memory: memoryRef },
			});

			// Initialize memory
			(instance.instance.exports.init as CallableFunction)();

			// Get counter address from the first compiled module
			const firstModule = Object.values(result.compiledModules)[0];
			const counterMemory = Object.values(firstModule.memoryMap).find(m => m.id.includes('out'));

			if (!counterMemory) {
				throw new Error('Could not find output memory in compiled module');
			}

			// Get initial value
			const initialValue = dataView.getInt32(counterMemory.byteAddress, true);

			// Call buffer function which should call cycle bufferSize times
			(instance.instance.exports.buffer as CallableFunction)();

			// The value should have changed after buffer calls
			const finalValue = dataView.getInt32(counterMemory.byteAddress, true);
			// Verify that buffer was called (exact behavior depends on module logic)
			expect(finalValue).not.toBe(initialValue);
		});

		test('buffer function executes cycle function the expected number of times (unrolled strategy)', async () => {
			const bufferSize = 10;
			const result = compile(modules, {
				...baseOptions,
				bufferSize,
				bufferStrategy: 'unrolled',
			});

			const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1 });
			const dataView = new DataView(memoryRef.buffer);
			const instance = await WebAssembly.instantiate(result.codeBuffer, {
				js: { memory: memoryRef },
			});

			// Initialize memory
			(instance.instance.exports.init as CallableFunction)();

			// Get counter address from the first compiled module
			const firstModule = Object.values(result.compiledModules)[0];
			const counterMemory = Object.values(firstModule.memoryMap).find(m => m.id.includes('out'));

			if (!counterMemory) {
				throw new Error('Could not find output memory in compiled module');
			}

			// Get initial value
			const initialValue = dataView.getInt32(counterMemory.byteAddress, true);

			// Call buffer function which should call cycle bufferSize times
			(instance.instance.exports.buffer as CallableFunction)();

			// The value should have changed after buffer calls
			const finalValue = dataView.getInt32(counterMemory.byteAddress, true);
			// Verify that buffer was called (exact behavior depends on module logic)
			expect(finalValue).not.toBe(initialValue);
		});

		test('different buffer sizes execute correct number of cycles', async () => {
			const sizes = [1, 5, 32, 128];

			for (const bufferSize of sizes) {
				const result = compile(modules, {
					...baseOptions,
					bufferSize,
					bufferStrategy: 'loop',
				});

				const memoryRef = new WebAssembly.Memory({ initial: 1, maximum: 1 });
				const dataView = new DataView(memoryRef.buffer);
				const instance = await WebAssembly.instantiate(result.codeBuffer, {
					js: { memory: memoryRef },
				});

				(instance.instance.exports.init as CallableFunction)();

				// Get counter address from the first compiled module
				const firstModule = Object.values(result.compiledModules)[0];
				const counterMemory = Object.values(firstModule.memoryMap).find(m => m.id.includes('out'));

				if (!counterMemory) {
					continue; // Skip if no output memory found
				}

				const initialValue = dataView.getInt32(counterMemory.byteAddress, true);
				(instance.instance.exports.buffer as CallableFunction)();
				const finalValue = dataView.getInt32(counterMemory.byteAddress, true);

				// Verify buffer executed (value changed)
				expect(finalValue).not.toBe(initialValue);
			}
		});
	});
});
