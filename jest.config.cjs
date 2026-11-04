const shared = {
  rootDir: __dirname,
  modulePathIgnorePatterns: ['<rootDir>/timer/package.json', '<rootDir>/scrambler/package.json', '<rootDir>/smartcubeanalyzer/package.json', '<rootDir>/build/'],
  moduleNameMapper: {
    '^@cuberplus/navigation$': '<rootDir>/shared/navigation/index.tsx',
    '^react$': require.resolve('react'),
    '^react-dom$': require.resolve('react-dom'),
    '^react-dom/client$': require.resolve('react-dom/client'),
    '^react/jsx-runtime$': require.resolve('react/jsx-runtime'),
    '^@testing-library/react$': require.resolve('@testing-library/react'),
    '\\.(css|png|jpe?g|gif|svg)$': '<rootDir>/src/tests/asset.cjs',
    '^.+/Workers/createChartWorker$': '<rootDir>/smartcubeanalyzer/src/Workers/__mocks__/createChartWorker.ts',
  },
};
const common = {
  ...shared,
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'CommonJS', moduleResolution: 'Node' } }] },
};
module.exports = {
  projects: [
    { ...common, displayName: 'site', testEnvironment: 'jsdom', testMatch: ['<rootDir>/src/**/*.test.ts?(x)', '<rootDir>/scrambler/src/**/*.test.ts?(x)'] },
    { ...common, displayName: 'analyzer', testEnvironment: 'node', testMatch: ['<rootDir>/smartcubeanalyzer/src/tests/**/*.test.ts?(x)'] },
    {
      ...shared, displayName: 'timer', testEnvironment: 'node',
      testMatch: ['<rootDir>/timer/src/tests/**/*.test.ts'],
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      transform: { '^.+\\.tsx?$': ['ts-jest', { useESM: true }] },
    },
  ],
};
