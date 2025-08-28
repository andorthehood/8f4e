/**
 * Jest setup file for editor package tests
 * This file runs before each test file and sets up global test environment
 */

// Global test timeout for long-running operations
jest.setTimeout(10000);

// Mock WebAssembly for tests that don't have access to it
global.WebAssembly = global.WebAssembly || {
	Memory: jest.fn().mockImplementation((descriptor) => ({
		buffer: new ArrayBuffer((descriptor?.initial || 1) * 65536),
		grow: jest.fn(),
	})),
	instantiate: jest.fn().mockResolvedValue({
		instance: {
			exports: {},
		},
		module: {},
	}),
	compile: jest.fn().mockResolvedValue({}),
	Module: jest.fn(),
	Instance: jest.fn(),
};

// Mock console methods by default to reduce noise in tests
// Individual tests can override these if they need to test console output
const originalConsole = { ...console };

beforeEach(() => {
	// Reset console mocks before each test
	console.log = jest.fn();
	console.warn = jest.fn();
	console.error = jest.fn();
	console.info = jest.fn();
	console.debug = jest.fn();
});

afterEach(() => {
	// Clean up any lingering timers or promises
	jest.clearAllTimers();
	jest.clearAllMocks();
});

// Global cleanup after all tests
afterAll(() => {
	// Restore original console
	Object.assign(console, originalConsole);
});

// Custom matchers for editor-specific testing
expect.extend({
	toBeValidWebAssemblyMemory(received) {
		const pass = received && 
			typeof received === 'object' && 
			received.buffer instanceof ArrayBuffer;
		
		if (pass) {
			return {
				message: () => `expected ${received} not to be a valid WebAssembly.Memory`,
				pass: true,
			};
		} else {
			return {
				message: () => `expected ${received} to be a valid WebAssembly.Memory`,
				pass: false,
			};
		}
	},
	
	toHaveValidProjectStructure(received) {
		const hasRequiredFields = received &&
			typeof received.title === 'string' &&
			Array.isArray(received.codeBlocks) &&
			received.viewport &&
			typeof received.viewport.x === 'number' &&
			typeof received.viewport.y === 'number' &&
			Array.isArray(received.runtimeSettings);
		
		if (hasRequiredFields) {
			return {
				message: () => `expected project not to have valid structure`,
				pass: true,
			};
		} else {
			return {
				message: () => `expected project to have valid structure with title, codeBlocks, viewport, and runtimeSettings`,
				pass: false,
			};
		}
	},
});

// Type augmentation for custom matchers
declare global {
	namespace jest {
		interface Matchers<R> {
			toBeValidWebAssemblyMemory(): R;
			toHaveValidProjectStructure(): R;
		}
	}
}