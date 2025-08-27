import { validateFeatureFlags, defaultFeatureFlags, FeatureFlagsConfig } from './featureFlags';

describe('Feature Flags Configuration', () => {
	test('validateFeatureFlags should return all defaults when given empty config', () => {
		const result = validateFeatureFlags({});
		expect(result).toEqual(defaultFeatureFlags);
	});

	test('validateFeatureFlags should return all defaults when given undefined', () => {
		const result = validateFeatureFlags();
		expect(result).toEqual(defaultFeatureFlags);
	});

	test('validateFeatureFlags should override specific flags', () => {
		const config: FeatureFlagsConfig = {
			contextMenu: false,
			moduleDragging: false,
		};
		const result = validateFeatureFlags(config);

		expect(result).toEqual({
			...defaultFeatureFlags,
			contextMenu: false,
			moduleDragging: false,
		});
	});

	test('defaultFeatureFlags should have all features enabled', () => {
		expect(defaultFeatureFlags.contextMenu).toBe(true);
		expect(defaultFeatureFlags.infoOverlay).toBe(true);
		expect(defaultFeatureFlags.moduleDragging).toBe(true);
		expect(defaultFeatureFlags.viewportDragging).toBe(true);
		expect(defaultFeatureFlags.persistentStorage).toBe(true);
		expect(defaultFeatureFlags.editing).toBe(true);
	});

	test('validateFeatureFlags should preserve enabled flags when disabled flags are specified', () => {
		const config: FeatureFlagsConfig = {
			contextMenu: false,
		};
		const result = validateFeatureFlags(config);

		expect(result.contextMenu).toBe(false);
		expect(result.infoOverlay).toBe(true);
		expect(result.moduleDragging).toBe(true);
		expect(result.viewportDragging).toBe(true);
		expect(result.persistentStorage).toBe(true);
		expect(result.editing).toBe(true);
	});

	test('validateFeatureFlags should allow disabling editing flag', () => {
		const config: FeatureFlagsConfig = {
			editing: false,
		};
		const result = validateFeatureFlags(config);

		expect(result.editing).toBe(false);
		expect(result.contextMenu).toBe(true);
		expect(result.infoOverlay).toBe(true);
		expect(result.moduleDragging).toBe(true);
		expect(result.viewportDragging).toBe(true);
		expect(result.persistentStorage).toBe(true);
	});

	test('validateFeatureFlags should allow combining editing flag with other flags', () => {
		const config: FeatureFlagsConfig = {
			editing: false,
			contextMenu: false,
			moduleDragging: false,
		};
		const result = validateFeatureFlags(config);

		expect(result.editing).toBe(false);
		expect(result.contextMenu).toBe(false);
		expect(result.moduleDragging).toBe(false);
		expect(result.infoOverlay).toBe(true);
		expect(result.viewportDragging).toBe(true);
		expect(result.persistentStorage).toBe(true);
	});
});
