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
    '\\.(css|png|jpe?g|gif|svg)$': '<rootDir>/tests/mocks/asset.cjs',
    '^.+/Workers/createChartWorker$': '<rootDir>/tests/mocks/createChartWorker.ts',
    '^.+/createDataWorker$': '<rootDir>/tests/mocks/dataWorker.ts',
  },
};
const common = {
  ...shared,
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'CommonJS', moduleResolution: 'Node' } }] },
};
module.exports = {
  projects: [
    { ...common, displayName: 'site', testEnvironment: 'jsdom', testMatch: ['<rootDir>/tests/site/**/*.test.ts?(x)', '<rootDir>/tests/scrambler/**/*.test.ts?(x)'] },
    { ...common, displayName: 'analyzer', testEnvironment: 'node', testMatch: ['<rootDir>/tests/analyzer/**/*.test.ts?(x)'] },
    {
      ...shared, displayName: 'timer', testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/timer/**/*.test.ts'],
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      transform: { '^.+\\.tsx?$': ['ts-jest', { useESM: true }] },
    },
  ],
};
