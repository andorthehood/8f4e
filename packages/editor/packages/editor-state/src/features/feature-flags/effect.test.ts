import { describe, it, expect, vi } from 'vitest';
import { StateManager } from '@8f4e/state-manager';

import featureFlagsEffect from './effect';

import type { State, EventDispatcher } from '~/types';

describe('featureFlagsEffect', () => {
	it('should toggle positionOffsetters when togglePositionOffsetters event is dispatched', () => {
		const mockState: Partial<State> = {
			featureFlags: {
				contextMenu: true,
				infoOverlay: true,
				moduleDragging: true,
				viewportDragging: true,
				viewportAnimations: true,
				persistentStorage: true,
				editing: true,
				demoMode: false,
				historyTracking: true,
				consoleOverlay: true,
				positionOffsetters: true,
			},
		};

		const subscribers: Record<string, Array<(event: unknown) => void>> = {};

		const mockEvents: EventDispatcher = {
			on: (eventName, callback) => {
				if (!subscribers[eventName]) {
					subscribers[eventName] = [];
				}
				subscribers[eventName].push(callback);
			},
			off: vi.fn(),
			dispatch: (eventName, eventObject) => {
				if (subscribers[eventName]) {
					subscribers[eventName].forEach(callback => callback(eventObject));
				}
			},
		};

		const mockStore: Partial<StateManager<State>> = {
			getState: () => mockState as State,
			set: (path, value) => {
				if (path === 'featureFlags.positionOffsetters') {
					mockState.featureFlags!.positionOffsetters = value as boolean;
				}
			},
		};

		featureFlagsEffect(mockStore as StateManager<State>, mockEvents);

		expect(mockState.featureFlags!.positionOffsetters).toBe(true);

		mockEvents.dispatch('togglePositionOffsetters');

		expect(mockState.featureFlags!.positionOffsetters).toBe(false);

		mockEvents.dispatch('togglePositionOffsetters');

		expect(mockState.featureFlags!.positionOffsetters).toBe(true);
	});
});
