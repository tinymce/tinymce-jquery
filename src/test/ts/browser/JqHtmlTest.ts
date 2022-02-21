/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @tinymce/prefer-fun */
import { Assertions } from '@ephox/agar';
import { context, describe, it } from '@ephox/bedrock-client';
import { setupIntegration } from '../../../main/ts/Integration';
import { createEditor, createHTML } from '../Utils';

setupIntegration();

describe('Check jQuery\'s `.html()` function', () => {
  context('passing no arguments to get the HTML content', () => {
    it('check div', () => {
      const div = document.createElement('div');
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hello '));
      const strong = document.createElement('strong');
      strong.appendChild(document.createTextNode('World'));
      p.appendChild(strong);
      div.appendChild(p);
      Assertions.assertEq('Expected matching html', `<p>Hello <strong>World</strong></p>`, $(div).html());
    });
    it('check editor', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Hello <strong>World</strong></p>');
        Assertions.assertEq('Expected matching html', `<p>Hello <strong>World</strong></p>`, elm.html());
      });
    });
  });
  context('passing a string to set the HTML content', () => {
    it('check div', () => {
      const div = document.createElement('div');
      $(div).html('<p>Hello <strong>World</strong></p>');
      Assertions.assertEq('Expected matching html', `<p>Hello <strong>World</strong></p>`, div.innerHTML);
    });
    it('check empty editor', async () => {
      await createEditor((elm, ed) => {
        elm.html('<p>Hello <strong>World</strong></p>');
        Assertions.assertEq('Expected matching html', '<p>Hello <strong>World</strong></p>', ed.getContent());
      });
    });
    it('check editor with existing content', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Existing content</p>');
        elm.html('<p>Hello <strong>World</strong></p>');
        Assertions.assertEq('Expected matching html', '<p>Hello <strong>World</strong></p>', ed.getContent());
      });
    });
  });
  context('passing a node to set the HTML content', () => {
    it('check div', () => {
      const div = document.createElement('div');
      const p = document.createElement('p');
      p.appendChild(document.createTextNode('Hello '));
      const strong = document.createElement('strong');
      strong.appendChild(document.createTextNode('World'));
      p.appendChild(strong);
      $(div).html(p);
      Assertions.assertEq('Expected matching html', `<p>Hello <strong>World</strong></p>`, div.innerHTML);
    });
    it('check that existing nodes get moved into a div', async () => {
      await createHTML(`<section><p id="move">Hello <strong>World</strong></p><div id="target"></div></section>`, (root) => {
        const p = root.querySelector('p#move') as HTMLParagraphElement;
        const div = root.querySelector('div#target') as HTMLDivElement;
        $(div).html(p);
        Assertions.assertEq('Expected matching html', `<p id="move">Hello <strong>World</strong></p>`, div.innerHTML);
        Assertions.assertEq('Expected moved nodes', `<div id="target"><p id="move">Hello <strong>World</strong></p></div>`, root.innerHTML);
      });
    });
    it('check empty editor', async () => {
      await createEditor((elm, ed) => {
        const p = document.createElement('p');
        p.appendChild(document.createTextNode('Hello '));
        const strong = document.createElement('strong');
        strong.appendChild(document.createTextNode('World'));
        p.appendChild(strong);
        elm.html(p);
        Assertions.assertEq('Expected matching html', '<p>Hello <strong>World</strong></p>', ed.getContent());
      });
    });
    it('check editor with existing content', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Existing content</p>');
        const p = document.createElement('p');
        p.appendChild(document.createTextNode('Hello '));
        const strong = document.createElement('strong');
        strong.appendChild(document.createTextNode('World'));
        p.appendChild(strong);
        elm.html(p);
        Assertions.assertEq('Expected matching html', '<p>Hello <strong>World</strong></p>', ed.getContent());
      });
    });
    it('check that existing nodes get moved into an editor', async () => {
      await createHTML(`<section><p id="move">Hello <strong>World</strong></p></section>`, async (root) => {
        const p = root.querySelector('p#move') as HTMLParagraphElement;
        await createEditor((elm, ed) => {
          elm.html(p);
          Assertions.assertEq('Expected matching html', `<p id="move">Hello <strong>World</strong></p>`, ed.getContent());
          Assertions.assertEq('Expected moved nodes', ``, root.innerHTML);
        });
      });
    });
  });

  // TODO: the types say we don't need to support a JQuery wrapped node but
  // that seems very odd given that other APIs do support that. Maybe try that
  // anyway?

  context('passing a function to produce a string to set the HTML content', () => {
    it('check div', () => {
      const div = document.createElement('div');
      $(div).html(function (i, oldHtml) {
        Assertions.assertEq('Check this', div, this);
        Assertions.assertEq('Check index', 0, i);
        Assertions.assertEq('Check existing html', ``, oldHtml);
        return '<p>Hello <strong>World</strong></p>';
      });
      Assertions.assertEq('Expected matching html', `<p>Hello <strong>World</strong></p>`, div.innerHTML);
    });
    it('check empty editor', async () => {
      await createEditor((elm, ed) => {
        elm.html(function (i, oldHtml) {
          Assertions.assertEq('Check this', elm[0], this);
          Assertions.assertEq('Check index', 0, i);
          Assertions.assertEq('Check existing html', ``, oldHtml);
          return '<p>Hello <strong>World</strong></p>';
        });
        Assertions.assertEq('Expected matching html', '<p>Hello <strong>World</strong></p>', ed.getContent());
      });
    });
    it('check editor with existing content', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Existing content</p>');
        elm.html(function (i, oldHtml) {
          Assertions.assertEq('Check this', elm[0], this);
          Assertions.assertEq('Check index', 0, i);
          Assertions.assertEq('Check existing html', `<p>Existing content</p>`, oldHtml);
          return '<p>Hello <strong>World</strong></p>';
        });
        Assertions.assertEq('Expected matching html', '<p>Hello <strong>World</strong></p>', ed.getContent());
      });
    });

  });
  context('passing a function to produce a node to set the HTML content', () => {
    it('check div', () => {
      const div = document.createElement('div');
      $(div).html(function (i, oldHtml) {
        Assertions.assertEq('Check this', div, this);
        Assertions.assertEq('Check index', 0, i);
        Assertions.assertEq('Check existing html', ``, oldHtml);
        const p = document.createElement('p');
        p.appendChild(document.createTextNode('Hello '));
        const strong = document.createElement('strong');
        strong.appendChild(document.createTextNode('World'));
        p.appendChild(strong);
        return p;
      });
      Assertions.assertEq('Expected matching html', `<p>Hello <strong>World</strong></p>`, div.innerHTML);
    });
    it('check that existing nodes get moved into a div', async () => {
      await createHTML(`<section><p id="move">Hello <strong>World</strong></p><div id="target"><p>Original</p></div></section>`, (root) => {
        const p = root.querySelector('p#move') as HTMLParagraphElement;
        const div = root.querySelector('div#target') as HTMLDivElement;
        $(div).html(function (i, oldHtml) {
          Assertions.assertEq('Check this', div, this);
          Assertions.assertEq('Check index', 0, i);
          Assertions.assertEq('Check existing html', `<p>Original</p>`, oldHtml);
          return p;
        });
        Assertions.assertEq('Expected matching html', `<p id="move">Hello <strong>World</strong></p>`, div.innerHTML);
        Assertions.assertEq('Expected moved nodes', `<div id="target"><p id="move">Hello <strong>World</strong></p></div>`, root.innerHTML);
      });
    });
    it('check empty editor', async () => {
      await createEditor((elm, ed) => {
        elm.html(function (i, oldHtml) {
          Assertions.assertEq('Check this', elm[0], this);
          Assertions.assertEq('Check index', 0, i);
          Assertions.assertEq('Check existing html', ``, oldHtml);
          const p = document.createElement('p');
          p.appendChild(document.createTextNode('Hello '));
          const strong = document.createElement('strong');
          strong.appendChild(document.createTextNode('World'));
          p.appendChild(strong);
          return p;
        });
        Assertions.assertEq('Expected matching html', '<p>Hello <strong>World</strong></p>', ed.getContent());
      });
    });
    it('check editor with existing content', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Existing content</p>');
        elm.html(function (i, oldHtml) {
          Assertions.assertEq('Check this', elm[0], this);
          Assertions.assertEq('Check index', 0, i);
          Assertions.assertEq('Check existing html', `<p>Existing content</p>`, oldHtml);
          const p = document.createElement('p');
          p.appendChild(document.createTextNode('Hello '));
          const strong = document.createElement('strong');
          strong.appendChild(document.createTextNode('World'));
          p.appendChild(strong);
          return p;
        });
        Assertions.assertEq('Expected matching html', '<p>Hello <strong>World</strong></p>', ed.getContent());
      });
    });
    it('check that existing nodes get moved into an editor', async () => {
      await createHTML(`<section><p id="move">Hello <strong>World</strong></p></section>`, async (root) => {
        const p = root.querySelector('p#move') as HTMLParagraphElement;
        await createEditor((elm, ed) => {
          elm.html(function (i, oldHtml) {
            Assertions.assertEq('Check this', elm[0], this);
            Assertions.assertEq('Check index', 0, i);
            Assertions.assertEq('Check existing html', ``, oldHtml);
            return p;
          });
          Assertions.assertEq('Expected matching html', `<p id="move">Hello <strong>World</strong></p>`, ed.getContent());
          Assertions.assertEq('Expected moved nodes', ``, root.innerHTML);
        });
      });
    });
  });
});