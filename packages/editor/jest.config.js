export default {
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/*.(test|spec).+(ts|tsx|js)'],
    testPathIgnorePatterns: [
        '<rootDir>/src/__tests__/utils/',
        '<rootDir>/src/__tests__/mocks/',
        '<rootDir>/src/__tests__/fixtures/',
        '<rootDir>/src/__tests__/index.ts',
        '<rootDir>/src/__tests__/setup.ts',
    ],
    transform: {
        "^.+\\.(t|j)sx?$": ["@swc/jest", {
            jsc: {
                target: 'es2021',
            },
            sourceMaps: true,
        }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    
    // Enhanced configuration for editor package testing
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    
    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/__tests__/**',
        '!src/index.ts', // Main export file
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    
    // Performance optimizations
    maxWorkers: '50%',
    cache: true,
    
    // Clear mocks between tests
    clearMocks: true,
    restoreMocks: true,
    
    // Timeout for long-running tests
    testTimeout: 10000,
}; 