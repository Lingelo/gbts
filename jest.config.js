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
            functions: 13,
            lines: 15,
            statements: 14,
        },
    },
    testPathIgnorePatterns: [
        "/node_modules/",
        "/dist/",
        "/__tests__/tmp/",
    ],
    setupFilesAfterEnv: [],
};
