
import { Assertions } from '@ephox/agar';
import { context, describe, it } from '@ephox/bedrock-client';
import { setupIntegration } from '../../../main/ts/Integration';
import { createEditor } from '../Utils';

setupIntegration();

describe('Check jQuery\'s `.val()` function', () => {
  context('passing no arguments to get the value', () => {
    it('gets the value of a input', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'text');
      input.value = 'Hello world';
      Assertions.assertEq('Expected value to match', 'Hello world', $(input).val());
    });
    it('gets the value of TinyMCE', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>The <strong>quick</strong> brown fox <em>jumps</em> over the lazy dog.</p>');
        Assertions.assertEq('Expected value to match', `<p>The <strong>quick</strong> brown fox <em>jumps</em> over the lazy dog.</p>`, elm.val());
      });
    });
  });
  context('passing a string sets the value', () => {
    it('sets the value of an input', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'text');
      $(input).val('Hello world');
      Assertions.assertEq('Expected value to match', 'Hello world', input.value);
    });
    it('sets the value of TinyMCE', async () => {
      await createEditor((elm, ed) => {
        elm.val('<p>The <strong>quick</strong> brown fox <em>jumps</em> over the lazy dog.</p>');
        Assertions.assertEq('Expected value to match', `<p>The <strong>quick</strong> brown fox <em>jumps</em> over the lazy dog.</p>`, ed.getContent());
      });
    });
  });
  context('passing a number sets the value', () => {
    it('sets the value of a progress', () => {
      const progress = document.createElement('progress');
      progress.max = 100;
      $(progress).val(63);
      Assertions.assertEq('Expected value to match', 63, progress.value);
    });
    it('sets the value of TinyMCE', async () => {
      await createEditor((elm, ed) => {
        elm.val(63);
        Assertions.assertEq('Expected value to match', `<p>63</p>`, ed.getContent());
      });
    });
  });
  context('passing a list of strings sets the value', () => {
    it('sets the value of a multi select', () => {
      const opt1 = document.createElement('option');
      opt1.value = 'one';
      opt1.appendChild(document.createTextNode('one'));
      const opt2 = document.createElement('option');
      opt2.value = 'two';
      opt2.appendChild(document.createTextNode('two'));
      const opt3 = document.createElement('option');
      opt3.value = 'three';
      opt3.appendChild(document.createTextNode('three'));
      const select = document.createElement('select');
      select.multiple = true;
      select.appendChild(opt1);
      select.appendChild(opt2);
      select.appendChild(opt3);

      $(select).val([ 'one', 'three' ]);
      Assertions.assertEq('Expected option 1 to be selected', true, opt1.selected);
      Assertions.assertEq('Expected option 2 to not be selected', false, opt2.selected);
      Assertions.assertEq('Expected option 3 to be selected', true, opt3.selected);
    });
    it('sets the value of TinyMCE', async () => {
      await createEditor((elm, ed) => {
        elm.val([ '<p>one</p>', '<p>three</p>' ]);
        Assertions.assertEq('Expected value to match', `<p>one</p>\n<p>three</p>`, ed.getContent());
      });
    });
  });
  context('passing a function that produces a string sets the value', () => {
    it('sets the value of an input', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'text');
      input.value = 'previous value';
      $(input).val(function (index, oldValue) {
        Assertions.assertEq('Check this', input, this);
        Assertions.assertEq('Check index', 0, index);
        Assertions.assertEq('Check existing value', 'previous value', oldValue);
        return 'Hello world';
      });
      Assertions.assertEq('Expected value to match', 'Hello world', input.value);
    });
    it('sets the value of TinyMCE', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>previous value</p>');
        elm.val(function (index, oldHtml) {
          Assertions.assertEq('Check this', elm[0], this);
          Assertions.assertEq('Check index', 0, index);
          Assertions.assertEq('Check existing value', '<p>previous value</p>', oldHtml);
          return '<p>The <strong>quick</strong> brown fox <em>jumps</em> over the lazy dog.</p>';
        });
        Assertions.assertEq('Expected value to match', `<p>The <strong>quick</strong> brown fox <em>jumps</em> over the lazy dog.</p>`, ed.getContent());
      });
    });
  });
});