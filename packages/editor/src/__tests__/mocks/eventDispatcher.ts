/**
 * Mock implementation for EventDispatcher
 */

import { EventDispatcher } from '../../events';

/**
 * Create a mock EventDispatcher with Jest mock functions
 */
export function createMockEventDispatcher(): EventDispatcher {
	return {
		on: jest.fn(),
		off: jest.fn(),
		dispatch: jest.fn(),
	};
}

/**
 * Create a mock EventDispatcher that actually stores and triggers events
 * Useful for tests that need to verify event flow
 */
export function createFunctionalMockEventDispatcher(): EventDispatcher {
	const subscriptions: Record<string, Function[]> = {};

	const mockDispatcher: EventDispatcher = {
		on: jest.fn(<T>(eventName: string, callback: (event: T) => void) => {
			if (!subscriptions[eventName]) {
				subscriptions[eventName] = [];
			}
			subscriptions[eventName].push(callback);
		}),
		
		off: jest.fn(<T>(eventName: string, callback: (event: T) => void) => {
			if (subscriptions[eventName]) {
				const index = subscriptions[eventName].indexOf(callback);
				if (index !== -1) {
					subscriptions[eventName].splice(index, 1);
				}
			}
		}),
		
		dispatch: jest.fn(<T>(eventName: string, eventObject?: T) => {
			if (subscriptions[eventName]) {
				subscriptions[eventName].forEach(callback => callback(eventObject));
			}
		}),
	};

	return mockDispatcher;
}

/**
 * Helper to extract event callbacks from a mock EventDispatcher
 */
export function getEventCallback(
	mockEventDispatcher: EventDispatcher,
	eventName: string
): Function | undefined {
	const onCalls = (mockEventDispatcher.on as jest.Mock).mock.calls;
	const targetCall = onCalls.find(call => call[0] === eventName);
	return targetCall ? targetCall[1] : undefined;
}

/**
 * Helper to trigger an event on a mock EventDispatcher
 */
export function triggerEvent<T>(
	mockEventDispatcher: EventDispatcher,
	eventName: string,
	eventData?: T
): void {
	const callback = getEventCallback(mockEventDispatcher, eventName);
	if (callback) {
		callback(eventData);
	}
}