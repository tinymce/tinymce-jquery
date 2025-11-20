
import { Assertions } from '@ephox/agar';
import { context, describe, it } from '@ephox/bedrock-client';
import { setupIntegration } from '../../../main/ts/Integration';
import { createEditor, createHTML } from '../Utils';

setupIntegration();

describe('Check jQuery\'s `.append()` function', () => {
  context('Append a string', () => {
    it('check that appending to a div works', () => {
      const div = document.createElement('div');
      $(div).append('<p>Hello world</p>');
      Assertions.assertEq('Expected content to match the appended content.', `<p>Hello world</p>`, div.innerHTML);
    });
    it('check that appending to an empty editor works', async () => {
      await createEditor((elm, ed) => {
        $(elm).append(`<p>Hello world</p>`);
        Assertions.assertEq('Expected editor content to match the appended content.', `<p>Hello world</p>`, ed.getContent());
      });
    });
    it('check that appending to an non-empty editor works', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Original content</p>');
        $(elm).append(`<p>Hello world</p>`);
        Assertions.assertEq(
          'Expected editor content to match the original + appended content.',
          `<p>Original content</p>\n<p>Hello world</p>`,
          ed.getContent()
        );
      });
    });
  });
  context('Append a list of string', () => {
    it('check that appending to a div works', () => {
      const div = document.createElement('div');
      $(div).append('<p>Hello</p>', '<p>', '<p>world</p>');
      Assertions.assertEq('Expected content to match the appended content.', `<p>Hello</p><p></p><p>world</p>`, div.innerHTML);
    });
    it('check that appending to an empty editor works', async () => {
      await createEditor((elm, ed) => {
        $(elm).append('<p>Hello</p>', '<p>', '<p>world</p>');
        Assertions.assertEq('Expected editor content to match the appended content.', `<p>Hello</p>\n<p>&nbsp;</p>\n<p>world</p>`, ed.getContent());
      });
    });
    it('check that appending to an non-empty editor works', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Original content</p>');
        $(elm).append('<p>Hello</p>', '<p>', '<p>world</p>');
        Assertions.assertEq(
          'Expected editor content to match the original + appended content.',
          `<p>Original content</p>\n<p>Hello</p>\n<p>&nbsp;</p>\n<p>world</p>`,
          ed.getContent()
        );
      });
    });
  });
  context('Append a node', () => {
    it('check that appending to a div works', () => {
      const div = document.createElement('div');
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hello world'));
      $(div).append(p);
      Assertions.assertEq('Expected content to match the appended content.', `<p>Hello world</p>`, div.innerHTML);
    });
    it('check that appending to an empty editor works', async () => {
      await createEditor((elm, ed) => {
        const p = document.createElement('p');
        p.appendChild(document.createTextNode('Hello world'));
        $(elm).append(p);
        Assertions.assertEq('Expected editor content to match the appended content.', `<p>Hello world</p>`, ed.getContent());
      });
    });
    it('check that appending to an non-empty editor works', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Original content</p>');
        const p = document.createElement('p');
        p.appendChild(document.createTextNode('Hello world'));
        $(elm).append(p);
        Assertions.assertEq(
          'Expected editor content to match the original + appended content.',
          `<p>Original content</p>\n<p>Hello world</p>`,
          ed.getContent()
        );
      });
    });
  });
  context('Append a list of node', () => {
    it('check that appending to a div works', () => {
      const div = document.createElement('div');
      const p1 = document.createElement('p');
      p1.appendChild(document.createTextNode('Hello'));
      const p2 = document.createElement('p');
      const p3 = document.createElement('p');
      p3.appendChild(document.createTextNode('world'));
      $(div).append(p1, p2, p3);
      Assertions.assertEq('Expected content to match the appended content.', `<p>Hello</p><p></p><p>world</p>`, div.innerHTML);
    });
    it('check that appending to an empty editor works', async () => {
      await createEditor((elm, ed) => {
        const p1 = document.createElement('p');
        p1.appendChild(document.createTextNode('Hello'));
        const p2 = document.createElement('p');
        const p3 = document.createElement('p');
        p3.appendChild(document.createTextNode('world'));
        $(elm).append(p1, p2, p3);
        Assertions.assertEq('Expected editor content to match the appended content.', `<p>Hello</p>\n<p>&nbsp;</p>\n<p>world</p>`, ed.getContent());
      });
    });
    it('check that appending to an non-empty editor works', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Original content</p>');
        const p1 = document.createElement('p');
        p1.appendChild(document.createTextNode('Hello'));
        const p2 = document.createElement('p');
        const p3 = document.createElement('p');
        p3.appendChild(document.createTextNode('world'));
        $(elm).append(p1, p2, p3);
        Assertions.assertEq(
          'Expected editor content to match the original + appended content.',
          `<p>Original content</p>\n<p>Hello</p>\n<p>&nbsp;</p>\n<p>world</p>`,
          ed.getContent()
        );
      });
    });
  });
  context('Append a jquery node set', () => {
    it('check that appending to a div works', async () => {
      await createHTML(`<section><p class="move">One</p><p>Two</p><p class="move">Three</p></section>`, (root) => {
        const div = document.createElement('div');
        const setOfP = $('p.move');
        $(div).append(setOfP);
        Assertions.assertEq('Expected content to match the appended content.', `<p class="move">One</p><p class="move">Three</p>`, div.innerHTML);
        Assertions.assertEq('Expected the nodes to have been removed from the root', `<p>Two</p>`, root.innerHTML);
      });
    });
    it('check that appending to an empty editor works', async () => {
      await createEditor(async (elm, ed) => {
        await createHTML(`<section><p class="move">One</p><p>Two</p><p class="move">Three</p></section>`, (root) => {
          const setOfP = $('p.move');
          $(elm).append(setOfP);
          Assertions.assertEq('Expected content to match the appended content.', `<p class="move">One</p>\n<p class="move">Three</p>`, ed.getContent());
          Assertions.assertEq('Expected the nodes to have been removed from the root', `<p>Two</p>`, root.innerHTML);
        });
      });
    });
    it('check that appending to an non-empty editor works', async () => {
      await createEditor(async (elm, ed) => {
        await createHTML(`<section><p class="move">One</p><p>Two</p><p class="move">Three</p></section>`, (root) => {
          const setOfP = $('p.move');
          ed.setContent('<p>Original content</p>');
          $(elm).append(setOfP);
          Assertions.assertEq('Expected content to match the appended content.',
            `<p>Original content</p>\n<p class="move">One</p>\n<p class="move">Three</p>`, ed.getContent());
          Assertions.assertEq('Expected the nodes to have been removed from the root', `<p>Two</p>`, root.innerHTML);
        });
      });
    });
  });
  context('Append a list of jquery node set', () => {
    it('check that appending to a div works', async () => {
      // eslint-disable-next-line max-len
      await createHTML(`<section><p class="move">One</p><p class="move2">Two</p><p class="move">Three</p><p>Four</p><p class="move2">Five</p></section>`, (root) => {
        const div = document.createElement('div');
        const listOfSetOfP = [ $('p.move'), $('p.move2') ];
        $(div).append(listOfSetOfP);
        Assertions.assertEq('Expected content to match the appended content.',
          `<p class="move">One</p><p class="move">Three</p><p class="move2">Two</p><p class="move2">Five</p>`, div.innerHTML);
        Assertions.assertEq('Expected the nodes to have been removed from the root', `<p>Four</p>`, root.innerHTML);
      });
    });
    it('check that appending to an empty editor works', async () => {
      await createEditor(async (elm, ed) => {
        // eslint-disable-next-line max-len
        await createHTML(`<section><p class="move">One</p><p class="move2">Two</p><p class="move">Three</p><p>Four</p><p class="move2">Five</p></section>`, (root) => {
          const listOfSetOfP = [ $('p.move'), $('p.move2') ];
          elm.append(listOfSetOfP);
          Assertions.assertEq('Expected content to match the appended content.',
            `<p class="move">One</p>\n<p class="move">Three</p>\n<p class="move2">Two</p>\n<p class="move2">Five</p>`, ed.getContent());
          Assertions.assertEq('Expected the nodes to have been removed from the root', `<p>Four</p>`, root.innerHTML);
        });
      });
    });
    it('check that appending to an non-empty editor works', async () => {
      await createEditor(async (elm, ed) => {
        // eslint-disable-next-line max-len
        await createHTML(`<section><p class="move">One</p><p class="move2">Two</p><p class="move">Three</p><p>Four</p><p class="move2">Five</p></section>`, (root) => {
          const listOfSetOfP = [ $('p.move'), $('p.move2') ];
          ed.setContent('<p>Original content</p>');
          elm.append(listOfSetOfP);
          Assertions.assertEq('Expected content to match the appended content.',
            `<p>Original content</p>\n<p class="move">One</p>\n<p class="move">Three</p>\n<p class="move2">Two</p>\n<p class="move2">Five</p>`,
            ed.getContent());
          Assertions.assertEq('Expected the nodes to have been removed from the root', `<p>Four</p>`, root.innerHTML);
        });
      });
    });
  });
});