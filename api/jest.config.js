// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Corrected path for setup.ts:
  // It's in the 'test' directory, relative to your project root.
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  testMatch: [
    // Corrected path for your test files:
    // They are inside 'test/__tests__'.
    '<rootDir>/src/test/__tests__/**/*.test.ts'
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testTimeout: 90000,
};