export default {
    testEnvironment: 'node',
    roots: ['<rootDir>/tests/visual'],
    testMatch: ['**/visual/**/*.+(ts|tsx|js)', '**/*.visual.(test|spec).+(ts|tsx|js)'],
    transform: {
        "^.+\\.(t|j)sx?$": ["@swc/jest", {
            jsc: {
                target: 'es2021',
            },
            sourceMaps: true,
        }],
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    setupFilesAfterEnv: ['<rootDir>/tests/visual/setup.ts'],
    testTimeout: 30000, // Visual tests may take longer
    globals: {
        // Add Node.js globals that Playwright might need
        setImmediate: true,
    },
};