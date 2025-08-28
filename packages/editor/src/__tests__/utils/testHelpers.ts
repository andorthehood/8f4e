/**
 * Common test setup and teardown utilities for editor tests
 */

/**
 * Setup console spy mocks with default implementations
 */
export function setupConsoleMocks() {
	const originalLog = console.log;
	const originalWarn = console.warn;
	const originalError = console.error;

	const logSpy = jest.spyOn(console, 'log').mockImplementation();
	const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
	const errorSpy = jest.spyOn(console, 'error').mockImplementation();

	return {
		logSpy,
		warnSpy,
		errorSpy,
		restoreConsole: () => {
			console.log = originalLog;
			console.warn = originalWarn;
			console.error = originalError;
			logSpy.mockRestore();
			warnSpy.mockRestore();
			errorSpy.mockRestore();
		},
	};
}

/**
 * Create a test environment with common setup and cleanup
 */
export function createTestEnvironment() {
	let cleanupFunctions: (() => void)[] = [];

	const addCleanup = (fn: () => void) => {
		cleanupFunctions.push(fn);
	};

	const cleanup = () => {
		cleanupFunctions.forEach(fn => fn());
		cleanupFunctions = [];
	};

	return {
		addCleanup,
		cleanup,
	};
}

/**
 * Wait for async operations to complete in tests
 */
export function waitForAsync(ms: number = 0): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock timer environment for testing time-dependent code
 */
export function setupMockTimers() {
	jest.useFakeTimers();
	
	return {
		advanceTime: (ms: number) => jest.advanceTimersByTime(ms),
		runAllTimers: () => jest.runAllTimers(),
		runOnlyPendingTimers: () => jest.runOnlyPendingTimers(),
		restoreTimers: () => jest.useRealTimers(),
	};
}

/**
 * Helper to run a test with isolated environment
 */
export function withTestEnvironment(testFn: (env: ReturnType<typeof createTestEnvironment>) => Promise<void> | void) {
	return async () => {
		const env = createTestEnvironment();
		try {
			await testFn(env);
		} finally {
			env.cleanup();
		}
	};
}