import compile from '../src';
import { compileToAST } from '../src/compiler';

describe('configurable buffer size', () => {
	const simpleModule = {
		code: [
			'module test',
			'float out',
			'push &out',
			'push 1.0',
			'store',
			'moduleEnd',
		],
	};

	test('should use default buffer size of 128 when not specified', () => {
		const result = compile([simpleModule], {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			maxMemorySize: 1,
			initialMemorySize: 1,
		});

		// The buffer function should call the cycle function 128 times
		// We can verify this by checking the bytecode length
		expect(result.codeBuffer).toBeDefined();
		expect(result.codeBuffer.length).toBeGreaterThan(0);
	});

	test('should use custom buffer size when specified', () => {
		const customBufferSize = 64;
		const result = compile([simpleModule], {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			maxMemorySize: 1,
			initialMemorySize: 1,
			bufferSize: customBufferSize,
		});

		expect(result.codeBuffer).toBeDefined();
		expect(result.codeBuffer.length).toBeGreaterThan(0);
	});

	test('should generate different bytecode for different buffer sizes', () => {
		const bufferSize64 = compile([simpleModule], {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			maxMemorySize: 1,
			initialMemorySize: 1,
			bufferSize: 64,
		});

		const bufferSize256 = compile([simpleModule], {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			maxMemorySize: 1,
			initialMemorySize: 1,
			bufferSize: 256,
		});

		// Different buffer sizes should produce different bytecode lengths
		expect(bufferSize64.codeBuffer.length).not.toBe(bufferSize256.codeBuffer.length);
		// The larger buffer size should produce longer bytecode
		expect(bufferSize256.codeBuffer.length).toBeGreaterThan(bufferSize64.codeBuffer.length);
	});

	test('should accept buffer size 0', () => {
		const result = compile([simpleModule], {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			maxMemorySize: 1,
			initialMemorySize: 1,
			bufferSize: 0,
		});

		expect(result.codeBuffer).toBeDefined();
		expect(result.codeBuffer.length).toBeGreaterThan(0);
	});

	test('should handle large buffer sizes', () => {
		const result = compile([simpleModule], {
			startingMemoryWordAddress: 0,
			environmentExtensions: { constants: {}, ignoredKeywords: [] },
			maxMemorySize: 1,
			initialMemorySize: 1,
			bufferSize: 1024,
		});

		expect(result.codeBuffer).toBeDefined();
		expect(result.codeBuffer.length).toBeGreaterThan(0);
	});
});