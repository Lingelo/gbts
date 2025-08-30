module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov", "html"],
    coverageThreshold: {
        global: {
            branches: 5,
            functions: 15,
            lines: 16,
            statements: 16,
        },
    },
    testPathIgnorePatterns: [
        "/node_modules/",
        "/dist/",
        "/__tests__/tmp/",
    ],
    setupFilesAfterEnv: [],
};
