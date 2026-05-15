import type { StorybookConfig } from '@storybook/html-vite';

const config: StorybookConfig = {
  stories: [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-docs"
  ],
  framework: {
    "name": "@storybook/html-vite",
    "options": {}
  },
  async viteFinal(config) {
    return config;
  }
};

export default config;
