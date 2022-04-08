/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @tinymce/prefer-fun */
import { Assertions } from '@ephox/agar';
import { context, describe, it } from '@ephox/bedrock-client';
import { setupIntegration } from '../../../main/ts/Integration';
import { createEditor, createHTML } from '../Utils';

setupIntegration();

describe('Check jQuery\'s `.text()` function', () => {
  context('passing no arguments to get the text content', () => {
    it('gets the text content of a div', async () => {
      await createHTML('<div><p>Hello</p><p>World</p></div>', (root) => {
        // I think under the hood it must be using textContent.
        Assertions.assertEq('Expected matching text', 'HelloWorld', $(root).text());
      });
    });
    it('gets the text content of two divs', async () => {
      await createHTML('<section><div><p>Hello</p><p>World</p></div><div>The quick brown fox.</div></section>', (root) => {
        const divs = $(root).find('div');
        Assertions.assertEq('Expected matching text', 'HelloWorldThe quick brown fox.', divs.text());
      });
    });
    it('gets the text of TinyMCE', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Hello</p><p>World</p>');
        Assertions.assertEq('Expected matching text', 'Hello\n\nWorld', elm.text());
      });
    });
    it('gets the text of TinyMCE and two divs', async () => {
      await createHTML(`<section><div><p>Before</p></div><div id="editor"><p>Middle</p></div><div><p>After</p></div></section>`, async (root) => {
        const divs = $(root).find('div');
        const ed = (await $('#editor').tinymce({ }))[0];
        try {
          Assertions.assertEq('Expected matching text', 'BeforeMiddleAfter', divs.text());
        } finally {
          ed.destroy();
        }
      });
    });
  });
  context('passing a string to set the text content', () => {
    it('sets the content of a div', () => {
      const div = document.createElement('div');
      $(div).text('Hello world');
      Assertions.assertEq('Expected matching HTML', 'Hello world', div.innerHTML);
    });
    it('sets the content of TinyMCE', async () => {
      await createEditor((elm, ed) => {
        elm.text('Hello\nWorld');
        Assertions.assertHtmlStructure('Expected matching HTML', '<p>Hello<br />World</p>', ed.getContent());
      });
    });
    it('sets the content of multiple things simultaneously', async () => {
      await createHTML(`<section><div>Before</div><div id="editor"></div></section>`, async (root) => {
        const divs = root.querySelectorAll('div');
        const ed = (await $('#editor').tinymce({ }))[0];
        try {
          $(divs).text('Hello');
          Assertions.assertEq('Expected matching html', 'Hello', divs[0].innerHTML);
          Assertions.assertEq('Expected editor content to match', '<p>Hello</p>', ed.getContent());
        } finally {
          ed.destroy();
        }
      });
    });
  });
  context('passing a number to set the text content', () => {
    it('sets the content of a div', () => {
      const div = document.createElement('div');
      $(div).text(42);
      Assertions.assertEq('Expected matching HTML', '42', div.innerHTML);
    });
    it('sets the content of TinyMCE', async () => {
      await createEditor((elm, ed) => {
        elm.text(17);
        Assertions.assertEq('Expected matching HTML', '<p>17</p>', ed.getContent());
      });
    });
    it('sets the content of multiple things simultaneously', async () => {
      await createHTML(`<section><div>Before</div><div id="editor"></div></section>`, async (root) => {
        const divs = root.querySelectorAll('div');
        const ed = (await $('#editor').tinymce({ }))[0];
        try {
          $(divs).text(9007199254740991);
          Assertions.assertEq('Expected matching html', '9007199254740991', divs[0].innerHTML);
          Assertions.assertEq('Expected editor content to match', '<p>9007199254740991</p>', ed.getContent());
        } finally {
          ed.destroy();
        }
      });
    });
  });
  context('passing a boolean to set the text content', () => {
    it('sets the content of a div', () => {
      const div = document.createElement('div');
      $(div).text(false);
      Assertions.assertEq('Expected matching HTML', 'false', div.innerHTML);
    });
    it('sets the content of TinyMCE', async () => {
      await createEditor((elm, ed) => {
        elm.text(true);
        Assertions.assertEq('Expected matching HTML', '<p>true</p>', ed.getContent());
      });
    });
    it('sets the content of multiple things simultaneously', async () => {
      await createHTML(`<section><div>Before</div><div id="editor"></div></section>`, async (root) => {
        const divs = root.querySelectorAll('div');
        const ed = (await $('#editor').tinymce({ }))[0];
        try {
          $(divs).text(true);
          Assertions.assertEq('Expected matching html', 'true', divs[0].innerHTML);
          Assertions.assertEq('Expected editor content to match', '<p>true</p>', ed.getContent());
        } finally {
          ed.destroy();
        }
      });
    });
  });
  context('passing a function producing a string to set the text content', () => {
    it('sets the content of a div', () => {
      const div = document.createElement('div');
      div.appendChild(document.createTextNode('Previous content'));
      $(div).text(function (index, prevValue) {
        Assertions.assertEq('Expected matching this', div, this);
        Assertions.assertEq('Expected matching index', 0, index);
        Assertions.assertEq('Expected matching previous content', 'Previous content', prevValue);
        return 'Hello world';
      });
      Assertions.assertEq('Expected matching HTML', 'Hello world', div.innerHTML);
    });
    it('sets the content of TinyMCE', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Previous</p><p>content</p>');
        elm.text(function (index, prevValue) {
          Assertions.assertEq('Expected matching this', elm[0], this);
          Assertions.assertEq('Expected matching index', 0, index);
          Assertions.assertEq('Expected matching previous content', 'Previous\n\ncontent', prevValue);
          return 'Hello\nworld';
        });
        Assertions.assertHtmlStructure('Expected matching HTML', '<p>Hello<br />world</p>', ed.getContent());
      });
    });
    it('sets the content of multiple things simultaneously', async () => {
      await createHTML(`<section><div>Content</div><div id="editor">Content</div></section>`, async (root) => {
        const divs = root.querySelectorAll('div');
        const ed = (await $('#editor').tinymce({ }))[0];
        try {
          $(divs).text(function (index, prevValue) {
            Assertions.assertEq('Expected matching this', divs[index], this);
            Assertions.assertEq('Expected matching previous content', 'Content', prevValue);
            return 'Hello';
          });
          Assertions.assertEq('Expected matching html', 'Hello', divs[0].innerHTML);
          Assertions.assertEq('Expected editor content to match', '<p>Hello</p>', ed.getContent());
        } finally {
          ed.destroy();
        }
      });
    });
  });
  context('passing a function producing a number to set the text content', () => {
    it('sets the content of a div', () => {
      const div = document.createElement('div');
      div.appendChild(document.createTextNode('Previous content'));
      $(div).text(function (index, prevValue) {
        Assertions.assertEq('Expected matching this', div, this);
        Assertions.assertEq('Expected matching index', 0, index);
        Assertions.assertEq('Expected matching previous content', 'Previous content', prevValue);
        return 42;
      });
      Assertions.assertEq('Expected matching HTML', '42', div.innerHTML);
    });
    it('sets the content of TinyMCE', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Previous</p><p>content</p>');
        elm.text(function (index, prevValue) {
          Assertions.assertEq('Expected matching this', elm[0], this);
          Assertions.assertEq('Expected matching index', 0, index);
          Assertions.assertEq('Expected matching previous content', 'Previous\n\ncontent', prevValue);
          return 345;
        });
        Assertions.assertEq('Expected matching HTML', '<p>345</p>', ed.getContent());
      });
    });
    it('sets the content of multiple things simultaneously', async () => {
      await createHTML(`<section><div>Content</div><div id="editor">Content</div></section>`, async (root) => {
        const divs = root.querySelectorAll('div');
        const ed = (await $('#editor').tinymce({ }))[0];
        try {
          $(divs).text(function (index, prevValue) {
            Assertions.assertEq('Expected matching this', divs[index], this);
            Assertions.assertEq('Expected matching previous content', 'Content', prevValue);
            return 98;
          });
          Assertions.assertEq('Expected matching html', '98', divs[0].innerHTML);
          Assertions.assertEq('Expected editor content to match', '<p>98</p>', ed.getContent());
        } finally {
          ed.destroy();
        }
      });
    });

  });
  context('passing a function producing a boolean to set the text content', () => {
    it('sets the content of a div', () => {
      const div = document.createElement('div');
      div.appendChild(document.createTextNode('Previous content'));
      $(div).text(function (index, prevValue) {
        Assertions.assertEq('Expected matching this', div, this);
        Assertions.assertEq('Expected matching index', 0, index);
        Assertions.assertEq('Expected matching previous content', 'Previous content', prevValue);
        return true;
      });
      Assertions.assertEq('Expected matching HTML', 'true', div.innerHTML);
    });
    it('sets the content of TinyMCE', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Previous</p><p>content</p>');
        elm.text(function (index, prevValue) {
          Assertions.assertEq('Expected matching this', elm[0], this);
          Assertions.assertEq('Expected matching index', 0, index);
          Assertions.assertEq('Expected matching previous content', 'Previous\n\ncontent', prevValue);
          return false;
        });
        Assertions.assertEq('Expected matching HTML', '<p>false</p>', ed.getContent());
      });
    });
    it('sets the content of multiple things simultaneously', async () => {
      await createHTML(`<section><div>Content</div><div id="editor">Content</div></section>`, async (root) => {
        const divs = root.querySelectorAll('div');
        const ed = (await $('#editor').tinymce({ }))[0];
        try {
          $(divs).text(function (index, prevValue) {
            Assertions.assertEq('Expected matching this', divs[index], this);
            Assertions.assertEq('Expected matching previous content', 'Content', prevValue);
            return false;
          });
          Assertions.assertEq('Expected matching html', 'false', divs[0].innerHTML);
          Assertions.assertEq('Expected editor content to match', '<p>false</p>', ed.getContent());
        } finally {
          ed.destroy();
        }
      });
    });
  });

});