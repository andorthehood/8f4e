export default {
    transform: {
        "^.+\\.(t|j)sx?$": ["@swc/jest", {
            jsc: {
                target: 'es2021',
            },
            sourceMaps: true,
        }],
    },
    setupFilesAfterEnv: ['./jest.image.ts'],
};
