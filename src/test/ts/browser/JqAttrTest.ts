/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @tinymce/prefer-fun */
import { Assertions } from '@ephox/agar';
import { context, describe, it } from '@ephox/bedrock-client';
import { setupIntegration } from '../../../main/ts/Integration';
import { createEditor } from '../Utils';

setupIntegration();

describe('Check jQuery\'s `.attr()` function', () => {
  context('passing a single string gets the associated attribute value or `undefined` when the attribute is not set', () => {
    it('Check that the attribute `"width"` returns undefined when it does not exist', () => {
      const el = document.createElement('div');
      Assertions.assertEq('Expected width attribute to be undefined', undefined, $(el).attr('width'));
    });
    it('Check that the attribute `"width"` can be read on a div', () => {
      const el = document.createElement('div');
      el.setAttribute('width', '50');
      Assertions.assertEq('Expected width attribute to be 50', '50', $(el).attr('width'));
    });
    it('Check that the attribute `"value"` can be read on a div', () => {
      const el = document.createElement('div');
      // note that this is different to the property `value` which does not show in the HTML
      el.setAttribute('value', '50');
      Assertions.assertEq('Expected value attribute to be 50', '50', $(el).attr('value'));
    });
    it('Check that the attribute `"value"` can be read on tinymce', async () => {
      await createEditor((targetElm, editor) => {
        editor.setContent(`<p>The quick brown fox jumps over the lazy dog.</p>`);
        const value = targetElm.attr('value');
        Assertions.assertEq('Expected `"value"` to match the editor content', `<p>The quick brown fox jumps over the lazy dog.</p>`, value);
      });
    });
  });

  context('passing two strings sets the associated attribute value', () => {
    it('Check that the attribute `"width"` can be created on a div', () => {
      const el = document.createElement('div');
      $(el).attr('width', '50');
      Assertions.assertEq('Expected width attribute to be 50', '50', el.getAttribute('width'));
    });
    it('Check that the attribute `"width"` can be written on a div', () => {
      const el = document.createElement('div');
      el.setAttribute('width', '10');
      $(el).attr('width', '50');
      Assertions.assertEq('Expected width attribute to be 50', '50', el.getAttribute('width'));
    });
    it('Check that the attribute `"value"` can be written on a div', () => {
      const el = document.createElement('div');
      // note that this is different to the property `value` which does not show in the HTML
      el.setAttribute('value', '10');
      $(el).attr('value', '50');
      Assertions.assertEq('Expected value attribute to be 50', '50', el.getAttribute('value'));
    });
    it('Check that the attribute `"value"` can be written on tinymce', async () => {
      await createEditor((targetElm, editor) => {
        targetElm.attr('value', `<p>The quick brown fox jumps over the lazy dog.</p>`);
        Assertions.assertEq('Expected `"value"` to match the editor content', `<p>The quick brown fox jumps over the lazy dog.</p>`, editor.getContent());
      });
    });
  });

  context('passing a string and a number sets the associated attribute value', () => {
    it('Check that the attribute `"width"` can be created on a div', () => {
      const el = document.createElement('div');
      $(el).attr('width', 50);
      Assertions.assertEq('Expected width attribute to be 50', '50', el.getAttribute('width'));
    });
    it('Check that the attribute `"width"` can be written on a div', () => {
      const el = document.createElement('div');
      el.setAttribute('width', '10');
      $(el).attr('width', 50);
      Assertions.assertEq('Expected width attribute to be 50', '50', el.getAttribute('width'));
    });
    it('Check that the attribute `"value"` can be written on tinymce', async () => {
      // admittedly this is not a very sensible thing to do.
      await createEditor((targetElm, editor) => {
        targetElm.attr('value', 12345678);
        // the editor will wrap the number in block tags to ensure it's valid HTML
        Assertions.assertEq('Expected `"value"` to match the editor content', `<p>12345678</p>`, editor.getContent());
      });
    });
  });

  context('passing a string and null removes the associated attribute from a normal element or sets it to empty on tinymce', () => {
    it('Check that the attribute `"width"` can be removed from a div', () => {
      const el = document.createElement('div');
      el.setAttribute('width', '50');
      $(el).attr('width', null);
      Assertions.assertEq('Expected not to have the `"width"` attribute', false, el.hasAttribute('width'));
    });
    it('Check that the attribute `"value"` can be set to empty on tinymce', async () => {
      // there are better ways to clear the editor but we want this to work
      await createEditor((targetElm, editor) => {
        editor.setContent('<p>The quick brown fox jumps over the lazy dog.</p>');
        targetElm.attr('value', null);
        // the editor will wrap the number in block tags to ensure it's valid HTML
        Assertions.assertEq('Expected `"value"` to match the editor content', ``, editor.getContent());
      });
    });

  });

  context('passing a string and a `(this: HTMLElement, index: number, prevValue: string) => string` sets the associated attribute value', () => {
    it('Check that the attribute `"width"` can be created on a div', () => {
      const el = document.createElement('div');
      // note that despite the types in this case `_oldValue` will be undefined, not empty string.
      $(el).attr('width', (_index, _oldValue) => '50');
      Assertions.assertEq('Expected width attribute to be 50', '50', el.getAttribute('width'));
    });
    it('Check that the attribute `"width"` can be updated on a div', () => {
      const el = document.createElement('div');
      el.setAttribute('width', '50');
      $(el).attr('width', (_index, oldValue) => `${parseInt(oldValue, 10) + 10}`);
      Assertions.assertEq('Expected width attribute to be 60', '60', el.getAttribute('width'));
    });
    it('Check that the attribute `"value"` can be updated on tinymce', async () => {
      await createEditor((targetElm, editor) => {
        editor.setContent('<p>Hello</p>');
        // in the case of TinyMCE `oldValue` will never be undefined as the "attribute" always exists
        targetElm.attr('value', (_index, oldValue) => oldValue + '<p>World</p>');
        // TinyMCE will pretty-ify the HTML and add a newline between them.
        Assertions.assertEq('Expected `"value"` to match the editor content', `<p>Hello</p>\n<p>World</p>`, editor.getContent());
      });
    });
  });

  context('passing a string and a `(this: HTMLElement, index: number, prevValue: string) => number` sets the associated attribute value', () => {
    it('Check that the attribute `"width"` can be created on a div', () => {
      const el = document.createElement('div');
      // note that despite the types in this case `_oldValue` will be undefined, not empty string.
      $(el).attr('width', (_index, _oldValue) => 50);
      Assertions.assertEq('Expected width attribute to be 50', '50', el.getAttribute('width'));
    });
    it('Check that the attribute `"width"` can be updated on a div', () => {
      const el = document.createElement('div');
      el.setAttribute('width', '50');
      $(el).attr('width', (_index, oldValue) => parseInt(oldValue, 10) + 10);
      Assertions.assertEq('Expected width attribute to be 60', '60', el.getAttribute('width'));
    });
    it('Check that the attribute `"value"` can be updated on tinymce', async () => {
      // you'd never actually want to do this...
      await createEditor((targetElm, editor) => {
        editor.setContent('<p>Hello</p>');
        targetElm.attr('value', (_index, oldValue) => oldValue.length);
        // TinyMCE will wrap the number in block tags.
        Assertions.assertEq('Expected `"value"` to match the editor content', `<p>12</p>`, editor.getContent());
      });
    });
  });

  context('passing a string and a `(this: HTMLElement, index: number, prevValue: string) => void | undefined` does nothing', () => {
    it('Check that the attribute `"width"` can be created on a div', () => {
      const el = document.createElement('div');
      // note that despite the types in this case `_oldValue` will be undefined, not empty string.
      $(el).attr('width', (_index, _oldValue) => undefined);
      Assertions.assertEq('Expected no width attribute', false, el.hasAttribute('width'));
    });
    it('Check that the attribute `"width"` can be updated on a div', () => {
      const el = document.createElement('div');
      el.setAttribute('width', '50');
      $(el).attr('width', (_index, oldValue) => {
        Assertions.assertEq('Expected oldValue to be 50', '50', oldValue);
      });
      Assertions.assertEq('Expected width attribute to be unchanged', '50', el.getAttribute('width'));
    });
    it('Check that the attribute `"value"` can be updated on tinymce', async () => {
      // you'd never actually want to do this...
      await createEditor((targetElm, editor) => {
        editor.setContent('<p>Hello</p>');
        targetElm.attr('value', (_index, oldValue) => {
          Assertions.assertEq('Expected oldValue to be editor content', `<p>Hello</p>`, oldValue);
        });
        Assertions.assertEq('Expected editor content to be unchanged', `<p>Hello</p>`, editor.getContent());
      });
    });
  });

  // Note that the types don't let us do this. I'm betting that users will do it anyway...
  context('passing a string and a `(this: HTMLElement, index: number, prevValue: string) => null` removes the associated attribute (or clears tinymce)', () => {
    it('Check that the attribute `"width"` can be removed from a div', () => {
      const el = document.createElement('div');
      el.setAttribute('width', '50');
      $(el).attr('width', (_index, _oldValue) => null as any);
      Assertions.assertEq('Expected not to have the `"width"` attribute', false, el.hasAttribute('width'));
    });
    it('Check that the attribute `"value"` can be set to empty on tinymce', async () => {
      // there are better ways to clear the editor but we want this to work
      await createEditor((targetElm, editor) => {
        editor.setContent('<p>The quick brown fox jumps over the lazy dog.</p>');
        targetElm.attr('value', (_index, _oldValue) => null as any);
        Assertions.assertEq('Expected `"value"` to match the editor content', ``, editor.getContent());
      });
    });
  });

  context('passing a set of attributes', () => {
    it('creating the attribute width on a div', () => {
      const el = document.createElement('div');
      $(el).attr({ width: '50' });
      Assertions.assertEq('Expected width attribute to be 50', '50', el.getAttribute('width'));
    });
    it('updating the attribute width on a div', () => {
      const el = document.createElement('div');
      el.setAttribute('width', '10');
      $(el).attr({ width: 50 });
      Assertions.assertEq('Expected width attribute to be 50', '50', el.getAttribute('width'));
    });
    it('removing the attribute width on a div', () => {
      const el = document.createElement('div');
      el.setAttribute('width', '50');
      $(el).attr({ width: null });
      Assertions.assertEq('Expected not to have the `"width"` attribute', false, el.hasAttribute('width'));
    });
    it('setting the attribute value on tinymce', async () => {
      await createEditor((targetElm, editor) => {
        targetElm.attr({ value: `<p>The quick brown fox jumps over the lazy dog.</p>` });
        Assertions.assertEq('Expected `"value"` to match the editor content', `<p>The quick brown fox jumps over the lazy dog.</p>`, editor.getContent());
      });
    });
    it('clearing the attribute value on tinymce', async () => {
      // there are better ways to clear the editor but we want this to work
      await createEditor((targetElm, editor) => {
        editor.setContent('<p>The quick brown fox jumps over the lazy dog.</p>');
        targetElm.attr({ value: null });
        Assertions.assertEq('Expected `"value"` to match the editor content', ``, editor.getContent());
      });
    });
  });
});