import { setupIntegration, RawEditorExtendedSettings } from '../main/ts/Integration';
import { StoryFn, Meta } from '@storybook/html-vite';

setupIntegration();

export default {
  title: 'TinyMCE Editor'
} as Meta;

let count = 0;
const Template: StoryFn<RawEditorExtendedSettings> = (args) => {
  const mount = `${count++}`;

  const mountNode = document.createElement('div');

  const addTinyMCE = () => {
    $(mountNode).after(`<div id="tiny${mount}"><p>The quick brown fox jumps over the lazy dog.</p></div>`);
    $(`div#tiny${mount}`).tinymce(args).catch((err) => {
      /* eslint-disable-next-line no-console */
      console.error('TinyMCE init failed', err);
    });
  };

  const removeTinyMCE = () => {
    $(`div#tiny${mount}`).remove();
  };

  // Observer for the storybook to add or remove our mount point
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      mutation.addedNodes.forEach((node) => {
        if (node === mountNode) {
          addTinyMCE();
        }
      });
      mutation.removedNodes.forEach((node) => {
        if (node === mountNode) {
          removeTinyMCE();
          // stop observing
          observer.disconnect();
        }
      });
    }
  });
  observer.observe(document.body, { attributes: false, childList: true, subtree: true });

  // when we see this node in the document we'll create tinymce, when it's removed we'll remove tinymce
  return mountNode;
};

export const IframeEditor = Template.bind({});
IframeEditor.args = {
  inline: false,
};

export const InlineEditor = Template.bind({});
InlineEditor.args = {
  inline: true,
};
