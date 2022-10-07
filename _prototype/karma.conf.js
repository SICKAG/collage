// Karma configuration
// Generated on Tue Jul 06 2021 10:20:02 GMT+0200 (Central European Summer Time)

module.exports = function (config) {
  config.set({

    client: {
      clearContext: false, // will show the results in browser once all the testcases are loaded
      args: config.debug ? ['--debug'] : [],

      jasmine: {
        // setting the test timeout intervall to 10 minutes when debugging
        timeoutInterval: config.debug ? 600000 : 5000,
      },
    },

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://www.npmjs.com/search?q=keywords:karma-adapter
    frameworks: ['jasmine', 'karma-typescript'],

    // list of files / patterns to load in the browser
    files: [
      { pattern: 'test/**/*.spec.ts', watched: true },
      {
        pattern: 'test/static/*.html', watched: true, included: false, served: true,
      },
      {
        pattern: 'test/features/**/*.html', watched: false, included: false, served: true,
      },
      { pattern: 'test/spec/**/*.ts', watched: true, include: false },
      { pattern: 'src/**/*.ts', include: false },
    ],

    middleware: ['serve-static-map'],
    serveStaticMap: [
      { fsPath: './test/static', baseURL: '/static/' },
      { fsPath: './test/features', baseURL: '/features/' },
      { fsPath: './bundle', baseURL: '/bundle/' },
    ],

    // list of files / patterns to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://www.npmjs.com/search?q=keywords:karma-preprocessor
    preprocessors: {
      '**/*.ts': ['karma-typescript'],
    },

    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-typescript',
      'karma-serve-static-map',
      'karma-jasmine-html-reporter',
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://www.npmjs.com/search?q=keywords:karma-reporter
    reporters: ['kjhtml', 'progress', 'karma-typescript'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    // autoWatch: true,

    // start these browsers
    // available browser launchers: https://www.npmjs.com/search?q=keywords:karma-launcher
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox', // required to run without privileges in docker
        ],
      },
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser instances should be started simultaneously
    concurrency: 0,

    browserDisconnectTimeout: 30000,

    karmaTypescriptConfig: {
      tsconfig: './tsconfig.json',
      sourceMap: 'true',
      compilerOptions: {
        module: 'commonjs',
        noUnusedParameters: false,
      },
      // for debugging, use instrumentation: false. Otherwise the source maps cannot get loaded properly
      coverageOptions: config.debug ? {
        instrumentation: false,
      } : {},
    },

  });
};
