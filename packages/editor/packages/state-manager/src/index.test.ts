import { describe, it, expect, beforeEach, vi } from 'vitest';

import createStateManager from './index';

// Test interface for state manager with deep nesting
interface TestState {
	name: string;
	age: number;
	settings: {
		theme: string;
		notifications: boolean;
		preferences: {
			language: string;
			timezone: string;
			display: {
				fontSize: number;
				animations: boolean;
				accessibility: {
					highContrast: boolean;
					screenReader: boolean;
				};
			};
		};
	};
	items: string[];
	user: {
		profile: {
			personal: {
				firstName: string;
				lastName: string;
				contact: {
					email: string;
					phone: string;
					address: {
						street: string;
						city: string;
						country: string;
					};
				};
			};
		};
	};
}

describe('StateManager', () => {
	let stateManager: ReturnType<typeof createStateManager<TestState>>;
	let initialState: TestState;

	beforeEach(() => {
		initialState = {
			name: 'John Doe',
			age: 30,
			settings: {
				theme: 'dark',
				notifications: true,
				preferences: {
					language: 'en',
					timezone: 'UTC',
					display: {
						fontSize: 14,
						animations: true,
						accessibility: {
							highContrast: false,
							screenReader: false,
						},
					},
				},
			},
			items: ['item1', 'item2'],
			user: {
				profile: {
					personal: {
						firstName: 'John',
						lastName: 'Doe',
						contact: {
							email: 'john@example.com',
							phone: '+1234567890',
							address: {
								street: '123 Main St',
								city: 'New York',
								country: 'USA',
							},
						},
					},
				},
			},
		};

		stateManager = createStateManager(initialState);
	});

	describe('getState', () => {
		it('should return the current state', () => {
			const state = stateManager.getState();
			expect(state).toEqual(initialState);
		});

		it('should return the same reference', () => {
			const state1 = stateManager.getState();
			const state2 = stateManager.getState();
			expect(state1).toBe(state2);
		});
	});

	describe('set', () => {
		it('should update top-level properties', () => {
			stateManager.set('name', 'Jane Doe');
			expect(stateManager.getState().name).toBe('Jane Doe');
		});

		it('should update nested properties', () => {
			stateManager.set('settings.theme', 'light');
			expect(stateManager.getState().settings.theme).toBe('light');
		});

		it('should update array properties', () => {
			stateManager.set('items', ['newItem1', 'newItem2']);
			expect(stateManager.getState().items).toEqual(['newItem1', 'newItem2']);
		});

		it('should maintain type safety', () => {
			stateManager.set('age', 25);
			stateManager.set('settings.notifications', false);
			stateManager.set('name', 'Test Name');
		});

		it('should support deep nesting (3 levels)', () => {
			stateManager.set('settings.preferences.language', 'es');
			expect(stateManager.getState().settings.preferences.language).toBe('es');
		});

		it('should support deep nesting (4 levels)', () => {
			stateManager.set('settings.preferences.display.fontSize', 16);
			expect(stateManager.getState().settings.preferences.display.fontSize).toBe(16);
		});

		it('should support deep nesting (5 levels)', () => {
			stateManager.set('settings.preferences.display.accessibility.highContrast', true);
			expect(stateManager.getState().settings.preferences.display.accessibility.highContrast).toBe(true);
		});

		it('should support very deep nesting (6 levels)', () => {
			stateManager.set('user.profile.personal.contact.address.city', 'Los Angeles');
			expect(stateManager.getState().user.profile.personal.contact.address.city).toBe('Los Angeles');
		});

		it('should support very deep nesting (7 levels)', () => {
			stateManager.set('user.profile.personal.contact.address.country', 'Canada');
			expect(stateManager.getState().user.profile.personal.contact.address.country).toBe('Canada');
		});
	});

	describe('subscribe', () => {
		it('should call callback when subscribed property changes', () => {
			const callback = vi.fn();
			stateManager.subscribe('name', callback);

			stateManager.set('name', 'New Name');

			expect(callback).toHaveBeenCalledWith('New Name');
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('should call callback for nested property changes', () => {
			const callback = vi.fn();
			stateManager.subscribe('settings.theme', callback);

			stateManager.set('settings.theme', 'light');

			expect(callback).toHaveBeenCalledWith('light');
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('should call callback for deep nested property changes (3 levels)', () => {
			const callback = vi.fn();
			stateManager.subscribe('settings.preferences.language', callback);

			stateManager.set('settings.preferences.language', 'fr');

			expect(callback).toHaveBeenCalledWith('fr');
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('should call callback for deep nested property changes (4 levels)', () => {
			const callback = vi.fn();
			stateManager.subscribe('settings.preferences.display.fontSize', callback);

			stateManager.set('settings.preferences.display.fontSize', 18);

			expect(callback).toHaveBeenCalledWith(18);
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('should call callback for very deep nested property changes (5 levels)', () => {
			const callback = vi.fn();
			stateManager.subscribe('settings.preferences.display.accessibility.screenReader', callback);

			stateManager.set('settings.preferences.display.accessibility.screenReader', true);

			expect(callback).toHaveBeenCalledWith(true);
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('should call callback for very deep nested property changes (6 levels)', () => {
			const callback = vi.fn();
			stateManager.subscribe('user.profile.personal.contact.email', callback);

			stateManager.set('user.profile.personal.contact.email', 'newemail@example.com');

			expect(callback).toHaveBeenCalledWith('newemail@example.com');
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it('should notify parent subscriptions when nested property changes', () => {
			const preferencesCallback = vi.fn();
			const displayCallback = vi.fn();
			const fontSizeCallback = vi.fn();

			stateManager.subscribe('settings.preferences', preferencesCallback);
			stateManager.subscribe('settings.preferences.display', displayCallback);
			stateManager.subscribe('settings.preferences.display.fontSize', fontSizeCallback);

			stateManager.set('settings.preferences.display.fontSize', 24);

			expect(fontSizeCallback).toHaveBeenCalledWith(24);
			expect(fontSizeCallback).toHaveBeenCalledTimes(1);
			expect(displayCallback).toHaveBeenCalledWith(stateManager.getState().settings.preferences.display);
			expect(displayCallback).toHaveBeenCalledTimes(1);
			expect(preferencesCallback).toHaveBeenCalledWith(stateManager.getState().settings.preferences);
			expect(preferencesCallback).toHaveBeenCalledTimes(1);
		});

		it('should notify child subscriptions when parent property is replaced', () => {
			const displayCallback = vi.fn();
			const fontSizeCallback = vi.fn();
			const animationsCallback = vi.fn();

			stateManager.subscribe('settings.preferences.display', displayCallback);
			stateManager.subscribe('settings.preferences.display.fontSize', fontSizeCallback);
			stateManager.subscribe('settings.preferences.display.animations', animationsCallback);

			stateManager.set('settings.preferences.display', {
				fontSize: 30,
				animations: false,
				accessibility: stateManager.getState().settings.preferences.display.accessibility,
			});

			expect(displayCallback).toHaveBeenCalledWith(stateManager.getState().settings.preferences.display);
			expect(fontSizeCallback).toHaveBeenCalledWith(30);
			expect(animationsCallback).toHaveBeenCalledWith(false);
		});

		it('should not notify subscriptions that only partially match the path', () => {
			const partialCallback = vi.fn();
			const exactCallback = vi.fn();

			stateManager.subscribe('settings.preferences.display.font', partialCallback);
			stateManager.subscribe('settings.preferences.display.fontSize', exactCallback);

			stateManager.set('settings.preferences.display.fontSize', 20);

			expect(exactCallback).toHaveBeenCalledWith(20);
			expect(partialCallback).not.toHaveBeenCalled();
		});

		it('should not call callback for different property changes', () => {
			const callback = vi.fn();
			stateManager.subscribe('name', callback);

			stateManager.set('age', 25);
			stateManager.set('settings.theme', 'light');

			expect(callback).not.toHaveBeenCalled();
		});

		it('should call multiple callbacks for the same property', () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			stateManager.subscribe('name', callback1);
			stateManager.subscribe('name', callback2);

			stateManager.set('name', 'New Name');

			expect(callback1).toHaveBeenCalledWith('New Name');
			expect(callback2).toHaveBeenCalledWith('New Name');
		});

		it('should return subscription object', () => {
			const callback = vi.fn();
			const subscription = stateManager.subscribe('name', callback);

			expect(subscription.selector).toBe('name');
			expect(subscription.tokens).toEqual(['name']);
			expect(subscription.callback).toBe(callback);
		});
	});

	describe('unsubscribe', () => {
		it('should remove subscription and stop calling callback', () => {
			const callback = vi.fn();
			stateManager.subscribe('name', callback);

			stateManager.unsubscribe('name', callback);
			stateManager.set('name', 'New Name');

			expect(callback).not.toHaveBeenCalled();
		});

		it('should remove subscription by selector and callback', () => {
			const callback = vi.fn();

			stateManager.subscribe('name', callback);

			stateManager.unsubscribe('name', callback);
			stateManager.set('name', 'New Name');

			expect(callback).not.toHaveBeenCalled();
		});

		it('should only remove the specific subscription', () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			stateManager.subscribe('name', callback1);
			stateManager.subscribe('name', callback2);

			stateManager.unsubscribe('name', callback1);
			stateManager.set('name', 'New Name');

			expect(callback1).not.toHaveBeenCalled();
			expect(callback2).toHaveBeenCalledWith('New Name');
		});

		it('should only remove the specific subscription by selector and callback', () => {
			const callback1 = vi.fn();
			const callback2 = vi.fn();

			stateManager.subscribe('name', callback1);
			stateManager.subscribe('name', callback2);

			stateManager.unsubscribe('name', callback1);
			stateManager.set('name', 'New Name');

			expect(callback1).not.toHaveBeenCalled();
			expect(callback2).toHaveBeenCalledWith('New Name');
		});

		it('should handle unsubscribing non-existent subscription gracefully', () => {
			expect(() => {
				stateManager.unsubscribe('name', vi.fn());
			}).not.toThrow();
		});
	});

	describe('integration', () => {
		it('should handle complex state updates with multiple subscriptions', () => {
			const nameCallback = vi.fn();
			const ageCallback = vi.fn();
			const themeCallback = vi.fn();
			const notificationsCallback = vi.fn();

			stateManager.subscribe('name', nameCallback);
			stateManager.subscribe('age', ageCallback);
			stateManager.subscribe('settings.theme', themeCallback);
			stateManager.subscribe('settings.notifications', notificationsCallback);

			// Update multiple properties
			stateManager.set('name', 'Updated Name');
			stateManager.set('age', 35);
			stateManager.set('settings.theme', 'light');
			stateManager.set('settings.notifications', false);

			expect(nameCallback).toHaveBeenCalledWith('Updated Name');
			expect(ageCallback).toHaveBeenCalledWith(35);
			expect(themeCallback).toHaveBeenCalledWith('light');
			expect(notificationsCallback).toHaveBeenCalledWith(false);

			// Verify final state
			const finalState = stateManager.getState();
			expect(finalState.name).toBe('Updated Name');
			expect(finalState.age).toBe(35);
			expect(finalState.settings.theme).toBe('light');
			expect(finalState.settings.notifications).toBe(false);
		});

		it('should update state by direct mutation', () => {
			const callback = vi.fn();
			stateManager.subscribe('name', callback);

			// Unsubscribe
			stateManager.unsubscribe('name', callback);

			// Update state
			stateManager.set('name', 'New Name');

			// Callback should not be called since we unsubscribed
			expect(callback).not.toHaveBeenCalled();

			// State should be updated (state manager mutates state in place)
			expect(stateManager.getState().name).toBe('New Name');

			// Original state object is mutated
			expect(initialState.name).toBe('New Name');
		});
	});

	describe('type safety', () => {
		it('should enforce correct types for set operations', () => {
			// These should compile without TypeScript errors
			stateManager.set('name', 'string value');
			stateManager.set('age', 42);
			stateManager.set('settings.theme', 'dark');
			stateManager.set('settings.notifications', true);
			stateManager.set('items', ['array', 'of', 'strings']);
		});

		it('should enforce correct types for subscription callbacks', () => {
			// These should compile without TypeScript errors
			stateManager.subscribe('name', (value: string) => {
				expect(typeof value).toBe('string');
			});

			stateManager.subscribe('age', (value: number) => {
				expect(typeof value).toBe('number');
			});

			stateManager.subscribe('settings.theme', (value: string) => {
				expect(typeof value).toBe('string');
			});

			stateManager.subscribe('settings.notifications', (value: boolean) => {
				expect(typeof value).toBe('boolean');
			});

			stateManager.subscribe('items', (value: string[]) => {
				expect(Array.isArray(value)).toBe(true);
			});
		});

		it('should enforce correct types for deep nested subscription callbacks', () => {
			// These should compile without TypeScript errors and have proper type inference
			stateManager.subscribe('settings.preferences.language', (value: string) => {
				expect(typeof value).toBe('string');
			});

			stateManager.subscribe('settings.preferences.display.fontSize', (value: number) => {
				expect(typeof value).toBe('number');
			});

			stateManager.subscribe('settings.preferences.display.animations', (value: boolean) => {
				expect(typeof value).toBe('boolean');
			});

			stateManager.subscribe('settings.preferences.display.accessibility.highContrast', (value: boolean) => {
				expect(typeof value).toBe('boolean');
			});

			stateManager.subscribe('user.profile.personal.firstName', (value: string) => {
				expect(typeof value).toBe('string');
			});

			stateManager.subscribe('user.profile.personal.contact.email', (value: string) => {
				expect(typeof value).toBe('string');
			});

			stateManager.subscribe('user.profile.personal.contact.address.city', (value: string) => {
				expect(typeof value).toBe('string');
			});
		});
	});
});
