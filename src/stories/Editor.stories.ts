import { setupIntegration, RawEditorExtendedSettings } from '../main/ts/Integration';
import { Story, Meta } from '@storybook/html';

setupIntegration();

// More on default export: https://storybook.js.org/docs/html/writing-stories/introduction#default-export
export default {
  'title': 'TinyMCE Editor',
  // More on argTypes: https://storybook.js.org/docs/html/api/argtypes
  'argTypes': {
  },
} as Meta;

let count = 0;
// More on component templates: https://storybook.js.org/docs/html/writing-stories/introduction#using-args
const Template: Story<RawEditorExtendedSettings> = (args) => {
  const mount = `${count++}`;

  const mountNode = document.createElement('div');

  const addTinyMCE = () => {
    $(mountNode).after(`<div id="tiny${mount}"><p>The quick brown fox jumps over the lazy dog.</p></div>`);
    $(`div#tiny${mount}`).tinymce(args);
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
  observer.observe(document.body, { 'attributes': false, 'childList': true, 'subtree': true });

  // when we see this node in the document we'll create tinymce, when it's removed we'll remove tinymce
  return mountNode;
};

export const IframeEditor = Template.bind({});
// More on args: https://storybook.js.org/docs/html/writing-stories/args
IframeEditor.args = {
  'inline': false,
};

export const InlineEditor = Template.bind({});
InlineEditor.args = {
  'inline': true,
};
