import { describe, test, expect } from 'vitest';

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

	test('defaultFeatureFlags should default editing to inactive', () => {
		expect(defaultFeatureFlags.contextMenu).toBe(true);
		expect(defaultFeatureFlags.infoOverlay).toBe(false);
		expect(defaultFeatureFlags.moduleDragging).toBe(true);
		expect(defaultFeatureFlags.codeLineSelection).toBe(false);
		expect(defaultFeatureFlags.viewportDragging).toBe(true);
		expect(defaultFeatureFlags.editing).toBe(false);
		expect(defaultFeatureFlags.modeToggling).toBe(true);
	});

	test('validateFeatureFlags should preserve enabled flags when disabled flags are specified', () => {
		const config: FeatureFlagsConfig = {
			contextMenu: false,
		};
		const result = validateFeatureFlags(config);

		expect(result.contextMenu).toBe(false);
		expect(result.infoOverlay).toBe(false);
		expect(result.moduleDragging).toBe(true);
		expect(result.codeLineSelection).toBe(false);
		expect(result.viewportDragging).toBe(true);
		expect(result.editing).toBe(false);
		expect(result.modeToggling).toBe(true);
	});

	test('validateFeatureFlags should preserve inactive editing unless explicitly enabled', () => {
		const config: FeatureFlagsConfig = {
			contextMenu: true,
		};
		const result = validateFeatureFlags(config);

		expect(result.contextMenu).toBe(true);
		expect(result.infoOverlay).toBe(false);
		expect(result.moduleDragging).toBe(true);
		expect(result.viewportDragging).toBe(true);
		expect(result.editing).toBe(false);
	});

	test('validateFeatureFlags should allow enabling editing', () => {
		const config: FeatureFlagsConfig = {
			editing: true,
		};
		const result = validateFeatureFlags(config);

		expect(result.editing).toBe(true);
		expect(result.contextMenu).toBe(true);
		expect(result.viewportDragging).toBe(true);
	});

	test('validateFeatureFlags should allow combining multiple non-mode flags', () => {
		const config: FeatureFlagsConfig = {
			contextMenu: false,
			moduleDragging: false,
		};
		const result = validateFeatureFlags(config);

		expect(result.contextMenu).toBe(false);
		expect(result.moduleDragging).toBe(false);
		expect(result.infoOverlay).toBe(false);
		expect(result.viewportDragging).toBe(true);
		expect(result.editing).toBe(false);
	});
});
