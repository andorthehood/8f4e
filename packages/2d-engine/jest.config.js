export default {
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/*.(test|spec).+(ts|tsx|js)'],
    testPathIgnorePatterns: ['/visual/'],  // Visual tests run separately
    transform: {
        "^.+\\.(t|j)sx?$": ["@swc/jest", {
            jsc: {
                target: 'es2021',
            },
            sourceMaps: true,
        }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
};