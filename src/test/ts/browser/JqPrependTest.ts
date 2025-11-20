
import { Assertions } from '@ephox/agar';
import { context, describe, it } from '@ephox/bedrock-client';
import { setupIntegration } from '../../../main/ts/Integration';
import { createEditor, createHTML } from '../Utils';

setupIntegration();

describe('Check jQuery\'s `.prepend()` function', () => {
  context('Prepend a string', () => {
    it('check that prepending to a div works', () => {
      const div = document.createElement('div');
      $(div).prepend('<p>Hello world</p>');
      Assertions.assertEq('Expected content to match the prepended content.', `<p>Hello world</p>`, div.innerHTML);
    });
    it('check that prepending to an empty editor works', async () => {
      await createEditor((elm, ed) => {
        $(elm).prepend(`<p>Hello world</p>`);
        Assertions.assertEq('Expected editor content to match the prepended content.', `<p>Hello world</p>`, ed.getContent());
      });
    });
    it('check that prepending to an non-empty editor works', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Original content</p>');
        $(elm).prepend(`<p>Hello world</p>`);
        Assertions.assertEq(
          'Expected editor content to match the prepended + original content.',
          `<p>Hello world</p>\n<p>Original content</p>`,
          ed.getContent()
        );
      });
    });
  });
  context('Prepend a list of string', () => {
    it('check that prepending to a div works', () => {
      const div = document.createElement('div');
      $(div).prepend('<p>Hello</p>', '<p>', '<p>world</p>');
      Assertions.assertEq('Expected content to match the prepended content.', `<p>Hello</p><p></p><p>world</p>`, div.innerHTML);
    });
    it('check that prepending to an empty editor works', async () => {
      await createEditor((elm, ed) => {
        $(elm).prepend('<p>Hello</p>', '<p>', '<p>world</p>');
        Assertions.assertEq('Expected editor content to match the prepended content.', `<p>Hello</p>\n<p>&nbsp;</p>\n<p>world</p>`, ed.getContent());
      });
    });
    it('check that prepending to an non-empty editor works', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Original content</p>');
        $(elm).prepend('<p>Hello</p>', '<p>', '<p>world</p>');
        Assertions.assertEq(
          'Expected editor content to match the prepended + original content.',
          `<p>Hello</p>\n<p>&nbsp;</p>\n<p>world</p>\n<p>Original content</p>`,
          ed.getContent()
        );
      });
    });
  });
  context('Prepend a node', () => {
    it('check that prepending to a div works', () => {
      const div = document.createElement('div');
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hello world'));
      $(div).prepend(p);
      Assertions.assertEq('Expected content to match the prepended content.', `<p>Hello world</p>`, div.innerHTML);
    });
    it('check that prepending to an empty editor works', async () => {
      await createEditor((elm, ed) => {
        const p = document.createElement('p');
        p.appendChild(document.createTextNode('Hello world'));
        $(elm).prepend(p);
        Assertions.assertEq('Expected editor content to match the prepended content.', `<p>Hello world</p>`, ed.getContent());
      });
    });
    it('check that prepending to an non-empty editor works', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Original content</p>');
        const p = document.createElement('p');
        p.appendChild(document.createTextNode('Hello world'));
        $(elm).prepend(p);
        Assertions.assertEq(
          'Expected editor content to match the prepended + original content.',
          `<p>Hello world</p>\n<p>Original content</p>`,
          ed.getContent()
        );
      });
    });
  });
  context('Prepend a list of node', () => {
    it('check that prepending to a div works', () => {
      const div = document.createElement('div');
      const p1 = document.createElement('p');
      p1.appendChild(document.createTextNode('Hello'));
      const p2 = document.createElement('p');
      const p3 = document.createElement('p');
      p3.appendChild(document.createTextNode('world'));
      $(div).prepend(p1, p2, p3);
      Assertions.assertEq('Expected content to match the prepended content.', `<p>Hello</p><p></p><p>world</p>`, div.innerHTML);
    });
    it('check that prepending to an empty editor works', async () => {
      await createEditor((elm, ed) => {
        const p1 = document.createElement('p');
        p1.appendChild(document.createTextNode('Hello'));
        const p2 = document.createElement('p');
        const p3 = document.createElement('p');
        p3.appendChild(document.createTextNode('world'));
        $(elm).prepend(p1, p2, p3);
        Assertions.assertEq('Expected editor content to match the prepended content.', `<p>Hello</p>\n<p>&nbsp;</p>\n<p>world</p>`, ed.getContent());
      });
    });
    it('check that prepending to an non-empty editor works', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Original content</p>');
        const p1 = document.createElement('p');
        p1.appendChild(document.createTextNode('Hello'));
        const p2 = document.createElement('p');
        const p3 = document.createElement('p');
        p3.appendChild(document.createTextNode('world'));
        $(elm).prepend(p1, p2, p3);
        Assertions.assertEq(
          'Expected editor content to match the prepended + original content.',
          `<p>Hello</p>\n<p>&nbsp;</p>\n<p>world</p>\n<p>Original content</p>`,
          ed.getContent()
        );
      });
    });
  });
  context('Prepend a jquery node set', () => {
    it('check that prepending to a div works', async () => {
      await createHTML(`<section><p class="move">One</p><p>Two</p><p class="move">Three</p></section>`, (root) => {
        const div = document.createElement('div');
        const setOfP = $('p.move');
        $(div).prepend(setOfP);
        Assertions.assertEq('Expected content to match the prepended content.', `<p class="move">One</p><p class="move">Three</p>`, div.innerHTML);
        Assertions.assertEq('Expected the nodes to have been removed from the root', `<p>Two</p>`, root.innerHTML);
      });
    });
    it('check that prepending to an empty editor works', async () => {
      await createEditor(async (elm, ed) => {
        await createHTML(`<section><p class="move">One</p><p>Two</p><p class="move">Three</p></section>`, (root) => {
          const setOfP = $('p.move');
          $(elm).prepend(setOfP);
          Assertions.assertEq('Expected content to match the prepended content.', `<p class="move">One</p>\n<p class="move">Three</p>`, ed.getContent());
          Assertions.assertEq('Expected the nodes to have been removed from the root', `<p>Two</p>`, root.innerHTML);
        });
      });
    });
    it('check that prepending to an non-empty editor works', async () => {
      await createEditor(async (elm, ed) => {
        await createHTML(`<section><p class="move">One</p><p>Two</p><p class="move">Three</p></section>`, (root) => {
          const setOfP = $('p.move');
          ed.setContent('<p>Original content</p>');
          $(elm).prepend(setOfP);
          Assertions.assertEq('Expected content to match the prepended + original content.',
            `<p class="move">One</p>\n<p class="move">Three</p>\n<p>Original content</p>`, ed.getContent());
          Assertions.assertEq('Expected the nodes to have been removed from the root', `<p>Two</p>`, root.innerHTML);
        });
      });
    });
  });
  context('Prepend a list of jquery node set', () => {
    it('check that prepending to a div works', async () => {
      // eslint-disable-next-line max-len
      await createHTML(`<section><p class="move">One</p><p class="move2">Two</p><p class="move">Three</p><p>Four</p><p class="move2">Five</p></section>`, (root) => {
        const div = document.createElement('div');
        const listOfSetOfP = [ $('p.move'), $('p.move2') ];
        $(div).prepend(listOfSetOfP);
        Assertions.assertEq('Expected content to match the prepended content.',
          `<p class="move">One</p><p class="move">Three</p><p class="move2">Two</p><p class="move2">Five</p>`, div.innerHTML);
        Assertions.assertEq('Expected the nodes to have been removed from the root', `<p>Four</p>`, root.innerHTML);
      });
    });
    it('check that prepending to an empty editor works', async () => {
      await createEditor(async (elm, ed) => {
        // eslint-disable-next-line max-len
        await createHTML(`<section><p class="move">One</p><p class="move2">Two</p><p class="move">Three</p><p>Four</p><p class="move2">Five</p></section>`, (root) => {
          const listOfSetOfP = [ $('p.move'), $('p.move2') ];
          elm.prepend(listOfSetOfP);
          Assertions.assertEq('Expected content to match the prepended content.',
            `<p class="move">One</p>\n<p class="move">Three</p>\n<p class="move2">Two</p>\n<p class="move2">Five</p>`, ed.getContent());
          Assertions.assertEq('Expected the nodes to have been removed from the root', `<p>Four</p>`, root.innerHTML);
        });
      });
    });
    it('check that prepending to an non-empty editor works', async () => {
      await createEditor(async (elm, ed) => {
        // eslint-disable-next-line max-len
        await createHTML(`<section><p class="move">One</p><p class="move2">Two</p><p class="move">Three</p><p>Four</p><p class="move2">Five</p></section>`, (root) => {
          const listOfSetOfP = [ $('p.move'), $('p.move2') ];
          ed.setContent('<p>Original content</p>');
          elm.prepend(listOfSetOfP);
          Assertions.assertEq('Expected content to match the prepended + original content.',
            `<p class="move">One</p>\n<p class="move">Three</p>\n<p class="move2">Two</p>\n<p class="move2">Five</p>\n<p>Original content</p>`,
            ed.getContent());
          Assertions.assertEq('Expected the nodes to have been removed from the root', `<p>Four</p>`, root.innerHTML);
        });
      });
    });
  });
});