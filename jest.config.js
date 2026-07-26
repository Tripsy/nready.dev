/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

const config = {
	// All imported modules in your tests should be mocked automatically
	// automock: false,

	// Stop running tests after `n` failures
	bail: 3,

	// The directory where Jest should store its cached dependency information
	// cacheDirectory: "/tmp/jest_0",

	// Automatically clear mock calls, instances, contexts and results before every test
	clearMocks: true,

	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: false,

	// An array of glob patterns indicating a set of files for which coverage information should be collected
	// collectCoverageFrom: undefined,

	// The directory where Jest should output its coverage files
	coverageDirectory: 'coverage',

	// An array of regexp pattern strings used to skip coverage collection
	// coveragePathIgnorePatterns: [
	//   "/node_modules/"
	// ],

	// Indicates which provider should be used to instrument code for coverage
	coverageProvider: 'v8',

	// A list of reporter names that Jest uses when writing coverage reports
	// coverageReporters: [
	//   "json",
	//   "text",
	//   "lcov",
	//   "clover"
	// ],

	// An object that configures minimum threshold enforcement for coverage results
	// coverageThreshold: undefined,

	// A path to a custom dependency extractor
	// dependencyExtractor: undefined,

	// Make calling deprecated APIs throw helpful error messages
	// errorOnDeprecated: false,

	// The default configuration for fake timers
	// fakeTimers: {
	//   "enableGlobally": false
	// },

	// Force coverage collection from ignored files using an array of glob patterns
	// forceCoverageMatch: [],

	// A path to a module which exports an async function that is triggered once before all test suites
	// globalSetup: undefined,

	// A path to a module which exports an async function that is triggered once after all test suites
	// globalTeardown: undefined,

	// A set of global variables that need to be available in all test environments
	// globals: {},

	// The maximum amount of workers used to run your tests. Can be specified as % or a number. E.g. maxWorkers: 10% will use 10% of your CPU amount + 1 as the maximum worker number. maxWorkers: 2 will use a maximum of 2 workers.
	//
	// Capped deliberately. Jest defaults to `cpus - 1`, which is 11 workers in the dev
	// container; at ~600 MB each that blows past the container's `mem_limit` and the
	// kernel SIGKILLs workers. A killed worker makes jest report "Test suite failed to
	// run" and skip that file's tests entirely, so the run still ends with a summary that
	// looks plausible while whole suites silently never executed.
	// 2 workers peaks at ~2.4 GB and is within budget for both this repo and nready.dev,
	// whose larger suite OOMs at 3+. Costs ~2s here versus 4 workers; not worth the risk.
	maxWorkers: 2,

	// An array of directory names to be searched recursively up from the requiring module's location
	// moduleDirectories: [
	//   "node_modules"
	// ],
	moduleDirectories: ['node_modules', 'src'],

	// An array of file extensions your modules use
	// moduleFileExtensions: [
	//   "js",
	//   "mjs",
	//   "cjs",
	//   "jsx",
	//   "ts",
	//   "tsx",
	//   "json",
	//   "node"
	// ],
	moduleFileExtensions: ['ts', 'js', 'json', 'node'],
	extensionsToTreatAsEsm: ['.ts'],

	// A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
	// moduleNameMapper: {},
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^(\\.{1,2}/.*)\\.js$': '$1', // Add this for ESM
	},

	// An array of regexp pattern strings, matched against all module paths before considered 'visible' to the module loader
	// modulePathIgnorePatterns: [],

	// Activates notifications for test results
	// notify: false,

	// An enum that specifies notification mode. Requires { notify: true }
	// notifyMode: "failure-change",

	// A preset that is used as a base for Jest's configuration
	preset: 'ts-jest/presets/default-esm',

	// Run tests from one or more projects
	// projects: undefined,

	// Use this configuration option to add custom reporters to Jest
	// reporters: undefined,

	// Automatically reset mock state before every test
	// resetMocks: false,

	// Reset the module registry before running each individual test
	// resetModules: false,

	// A path to a custom resolver
	// resolver: undefined,

	// Automatically restore mock state and implementation before every test
	// restoreMocks: false,

	// The root directory that Jest should scan for tests and modules within
	// rootDir: undefined,
	rootDir: '.',

	// A list of paths to directories that Jest should use to search for files in
	// roots: [
	//   "<rootDir>"
	// ],
	roots: ['<rootDir>/src'],

	// Allows you to use a custom runner instead of Jest's default test runner
	// runner: "jest-runner",

	// The paths to modules that run some code to configure or set up the testing environment before each test
	// setupFiles: ['<rootDir>/src/tests/jest.preload.ts'],

	// A list of paths to modules that run some code to configure or set up the testing framework before each test
	setupFilesAfterEnv: ['<rootDir>/src/tests/jest.setup.ts'],

	// The number of seconds after which a test is considered as slow and reported as such in the results.
	// slowTestThreshold: 5,

	// A list of paths to snapshot serializer modules Jest should use for snapshot testing
	// snapshotSerializers: [],

	// The test environment that will be used for testing
	// testEnvironment: "jest-environment-node",
	testEnvironment: 'node',

	// Options that will be passed to the testEnvironment
	// testEnvironmentOptions: {},

	// Adds a location field to test results
	// testLocationInResults: false,

	// The glob patterns Jest uses to detect test files
	testMatch: [
		'<rootDir>/src/tests/**/*.test.ts',
		'<rootDir>/src/features/**/tests/*.test.ts',
	],

	// An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
	testPathIgnorePatterns: ['/node_modules/'],

	// The regexp pattern or array of patterns that Jest uses to detect test files
	// testRegex: [],

	// This option allows the use of a custom results processor
	// testResultsProcessor: undefined,

	// This option allows use of a custom test runner
	// testRunner: "jest-circus/runner",

	// A map from regular expressions to paths to transformers
	// transform: undefined,
	transform: {
		'^.+\\.tsx?$': [
			'ts-jest',
			{
				useESM: true,
				tsconfig: 'tsconfig.json',
			},
		],
	},

	// An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
	// transformIgnorePatterns: [
	//   "/node_modules/",
	//   "\\.pnp\\.[^\\/]+$"
	// ],

	// An array of regexp pattern strings that are matched against all modules before the module loader will automatically return a mock for them
	// unmockedModulePathPatterns: undefined,

	// Indicates whether each individual test should be reported during the run
	// verbose: undefined,

	// An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode
	// watchPathIgnorePatterns: [],

	// Whether to use watchman for file crawling
	// watchman: true,
};

export default config;
