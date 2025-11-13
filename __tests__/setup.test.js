//Basic setup test to verify Jest is working


describe('Project Setup', () => {
  test('Jest is configured and working', () => {
    expect(true).toBe(true);
  });

  test('Node environment is available', () => {
    expect(process.version).toBeDefined();
    expect(process.env).toBeDefined();
  });

  test('Package version is defined', () => {
    const packageJson = require('../package.json');
    expect(packageJson.version).toBeDefined();
    expect(packageJson.name).toBe('api-ex');
  });
});
