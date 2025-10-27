module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/__mocks__/', '/setup\\.'],
  setupFiles: ['<rootDir>/jest.setup.js'],

  // Coverage configuration
  collectCoverage: false, // Only when explicitly requested
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',           // Console output
    'text-summary',   // Brief summary
    'lcov',           // For CI tools (Codecov, Coveralls)
    'html',           // Interactive HTML report
    'json-summary',   // JSON summary for badges
    'cobertura',      // XML format for CI integration
  ],

  // Minimum coverage thresholds
  // Current coverage: ~36% - Set realistic goals and increase over time
  coverageThreshold: {
    global: {
      branches: 30,    // Current: 34.81% - Maintain above 30%
      functions: 25,   // Current: 30.20% - Maintain above 25%
      lines: 30,       // Current: 35.79% - Maintain above 30%
      statements: 30,  // Current: 36.09% - Maintain above 30%
    },
    // TODO: Gradually increase thresholds as coverage improves
    // Target: branches: 60, functions: 65, lines: 70, statements: 70
  },

  // Performance
  maxWorkers: '50%',

  // Verbose output
  verbose: true,

  // Transform using ts-jest
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
    }],
  },
};
