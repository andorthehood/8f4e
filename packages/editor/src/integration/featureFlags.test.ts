import { describe, test, expect } from 'vitest';

import { validateFeatureFlags } from '../config/featureFlags';

import type { Options } from '@8f4e/editor-state-types';

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
		expect(featureFlags.infoOverlay).toBe(false);
		expect(featureFlags.viewportDragging).toBe(true);
		expect(featureFlags.editing).toBe(false);
	});

	test('should handle feature flags override correctly', () => {
		const options: Partial<Options> = {
			featureFlags: {
				infoOverlay: true, // Override default
			},
		};

		const featureFlags = validateFeatureFlags(options.featureFlags);

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
		expect(result).toHaveProperty('codeLineSelection');
		expect(result).toHaveProperty('viewportDragging');
		expect(result).toHaveProperty('editing');
		expect(result).toHaveProperty('modeToggling');

		// Should merge correctly
		expect(result.contextMenu).toBe(false);
		expect(result.infoOverlay).toBe(false);
		expect(result.moduleDragging).toBe(true);
		expect(result.codeLineSelection).toBe(false);
		expect(result.viewportDragging).toBe(true);
		expect(result.editing).toBe(false);
		expect(result.modeToggling).toBe(true);
	});

	test('should preserve defaults when no mode is configured through feature flags', () => {
		const options: Partial<Options> = {
			featureFlags: {
				contextMenu: true,
			},
		};

		const featureFlags = validateFeatureFlags(options.featureFlags);

		expect(featureFlags.contextMenu).toBe(true);
		expect(featureFlags.infoOverlay).toBe(false);
		expect(featureFlags.moduleDragging).toBe(true);
		expect(featureFlags.codeLineSelection).toBe(false);
		expect(featureFlags.viewportDragging).toBe(true);
		expect(featureFlags.editing).toBe(false);
		expect(featureFlags.modeToggling).toBe(true);
	});

	test('should support view-oriented feature configuration with contextMenu disabled', () => {
		const options: Partial<Options> = {
			featureFlags: {
				contextMenu: false,
				moduleDragging: false,
			},
		};

		const featureFlags = validateFeatureFlags(options.featureFlags);

		expect(featureFlags.contextMenu).toBe(false);
		expect(featureFlags.moduleDragging).toBe(false);
		expect(featureFlags.codeLineSelection).toBe(false);
		expect(featureFlags.modeToggling).toBe(true);
		// Navigation should remain enabled while info overlay stays at its default
		expect(featureFlags.viewportDragging).toBe(true);
		expect(featureFlags.editing).toBe(false);
		expect(featureFlags.infoOverlay).toBe(false);
	});

	test('should allow editing to be configured as active', () => {
		const featureFlags = validateFeatureFlags({
			editing: true,
			contextMenu: false,
		});

		expect(featureFlags.editing).toBe(true);
		expect(featureFlags.contextMenu).toBe(false);
		expect(featureFlags.modeToggling).toBe(true);
	});
});
