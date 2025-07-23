module.exports = {
  "stories": [
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": ["@storybook/addon-webpack5-compiler-babel"],
  "framework": "@storybook/html-webpack5",
  "core": {
    "builder": { name: "@storybook/builder-webpack5" }
  },
  "webpackFinal": async (config, { configType }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.

    // Make whatever fine-grained changes you need
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Return the altered config
    return config;
  }
}