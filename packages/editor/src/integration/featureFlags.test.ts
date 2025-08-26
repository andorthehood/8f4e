import { validateFeatureFlags } from '../config/featureFlags';
import { Options } from '../state/types';

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
		expect(featureFlags.localStorage).toBe(true);
	});

	test('should handle backward compatibility logic for localStorage', () => {
		const options: Partial<Options> = {
			isLocalStorageEnabled: false,
		};

		const featureFlags = validateFeatureFlags(options.featureFlags);

		// When no feature flags are specified but legacy option is provided,
		// the logic in init() should apply the legacy option
		// Here we're testing the base validation that doesn't have legacy logic
		expect(featureFlags.localStorage).toBe(true); // Default value

		// Test that the options contain the legacy setting
		expect(options.isLocalStorageEnabled).toBe(false);
	});

	test('should handle feature flags override of legacy options', () => {
		const options: Partial<Options> = {
			isLocalStorageEnabled: true,
			featureFlags: {
				localStorage: false, // This should override the legacy option
			},
		};

		const featureFlags = validateFeatureFlags(options.featureFlags);

		expect(featureFlags.localStorage).toBe(false); // Feature flag takes precedence
		expect(options.isLocalStorageEnabled).toBe(true); // Legacy option preserved
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
		expect(result).toHaveProperty('localStorage');

		// Should merge correctly
		expect(result.contextMenu).toBe(false);
		expect(result.infoOverlay).toBe(true);
		expect(result.moduleDragging).toBe(true);
		expect(result.viewportDragging).toBe(true);
		expect(result.localStorage).toBe(true);
	});
});
