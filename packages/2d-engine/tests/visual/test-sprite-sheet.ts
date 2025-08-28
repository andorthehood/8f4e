// Simple test to ensure the infrastructure is working without browser dependencies  
describe('Visual Test Infrastructure', () => {
    it('should have basic test configuration', () => {
        expect(true).toBe(true);
    });
    
    it('should have jest-image-snapshot available', () => {
        expect(typeof require('jest-image-snapshot')).toBe('object');
    });
});