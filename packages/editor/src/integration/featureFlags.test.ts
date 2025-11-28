import { describe, test, expect } from 'vitest';

import { validateFeatureFlags } from '../config/featureFlags';

import type { Options } from '@8f4e/editor-state';

describe('Feature Flags Integration', () => {
	test('should properly merge feature flags with options', () => {
		const options: Partial<Options> = {
			featureFlags: {
				contextMenu: false,
				moduleDragging: false,
			},
		};

		const featureFlags = validateFeatureFlags(options.featureFlags);

		expect(featureFlags.contextMenu).toBe(false);
		expect(featureFlags.moduleDragging).toBe(false);
		// Other flags should remain at defaults
		expect(featureFlags.infoOverlay).toBe(true);
		expect(featureFlags.viewportDragging).toBe(true);
		expect(featureFlags.persistentStorage).toBe(true);
	});

	test('should handle feature flags override correctly', () => {
		const options: Partial<Options> = {
			featureFlags: {
				persistentStorage: false,
				infoOverlay: true, // Override default
			},
		};

		const featureFlags = validateFeatureFlags(options.featureFlags);

		expect(featureFlags.persistentStorage).toBe(false);
		expect(featureFlags.infoOverlay).toBe(true);
	});

	test('should validate all feature flags are present after merging', () => {
		const partialFlags = {
			contextMenu: false,
		};

		const result = validateFeatureFlags(partialFlags);

		// Should have all required properties
		expect(result).toHaveProperty('contextMenu');
		expect(result).toHaveProperty('infoOverlay');
		expect(result).toHaveProperty('moduleDragging');
		expect(result).toHaveProperty('viewportDragging');
		expect(result).toHaveProperty('persistentStorage');
		expect(result).toHaveProperty('editing');

		// Should merge correctly
		expect(result.contextMenu).toBe(false);
		expect(result.infoOverlay).toBe(true);
		expect(result.moduleDragging).toBe(true);
		expect(result.viewportDragging).toBe(true);
		expect(result.persistentStorage).toBe(true);
		expect(result.editing).toBe(true);
	});

	test('should handle editing flag configuration', () => {
		const options: Partial<Options> = {
			featureFlags: {
				editing: false,
			},
		};

		const featureFlags = validateFeatureFlags(options.featureFlags);

		expect(featureFlags.editing).toBe(false);
		// Other flags should remain at defaults
		expect(featureFlags.contextMenu).toBe(true);
		expect(featureFlags.infoOverlay).toBe(true);
		expect(featureFlags.moduleDragging).toBe(true);
		expect(featureFlags.viewportDragging).toBe(true);
		expect(featureFlags.persistentStorage).toBe(true);
	});

	test('should support view-only mode with editing and contextMenu disabled', () => {
		const options: Partial<Options> = {
			featureFlags: {
				editing: false,
				contextMenu: false,
				moduleDragging: false,
			},
		};

		const featureFlags = validateFeatureFlags(options.featureFlags);

		expect(featureFlags.editing).toBe(false);
		expect(featureFlags.contextMenu).toBe(false);
		expect(featureFlags.moduleDragging).toBe(false);
		// Navigation and info should remain enabled
		expect(featureFlags.viewportDragging).toBe(true);
		expect(featureFlags.infoOverlay).toBe(true);
		expect(featureFlags.persistentStorage).toBe(true);
	});
});
