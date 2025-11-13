module.exports = {

  testEnvironment: 'node',

  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js'
  ],


  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!**/node_modules/**'
  ],


  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },


  clearMocks: true,
  verbose: true
};
