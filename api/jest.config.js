module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true // Helps with type issues
    }]
  },
  globalSetup: '<rootDir>/src/test/setup.ts',
  globalTeardown: '<rootDir>/src/test/teardown.ts',
  detectOpenHandles: true,
  forceExit: true
};