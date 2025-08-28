import { toMatchImageSnapshot } from 'jest-image-snapshot';

// Add custom matcher to Jest
expect.extend({ toMatchImageSnapshot });

// Configure jest-image-snapshot defaults
const customConfig = {
    threshold: 0.2, // Allow some small differences due to rendering variations
    thresholdType: 'percent',
    failureThreshold: 0.01, // Allow 1% pixel differences
    failureThresholdType: 'percent',
    allowSizeMismatch: false, // Require exact size match
};

// Override default toMatchImageSnapshot with our config
// @ts-ignore
expect.extend({
    toMatchImageSnapshot: (received: Buffer) => toMatchImageSnapshot(received, customConfig),
});

// Empty test to satisfy Jest's requirement
describe('Visual Test Setup', () => {
    it('should be configured correctly', () => {
        expect(true).toBe(true);
    });
});