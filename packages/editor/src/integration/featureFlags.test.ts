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

		// Should merge correctly
		expect(result.contextMenu).toBe(false);
		expect(result.infoOverlay).toBe(true);
		expect(result.moduleDragging).toBe(true);
		expect(result.viewportDragging).toBe(true);
		expect(result.persistentStorage).toBe(true);
	});
});
