
import { ApproxStructure, Assertions } from '@ephox/agar';
import { context, describe, it } from '@ephox/bedrock-client';
import { SugarElement } from '@ephox/sugar';
import { Editor } from 'tinymce';
import { setupIntegration } from '../../../main/ts/Integration';
import { createHTML } from '../Utils';

setupIntegration();

describe('Check jQuery\'s `.remove()` function', () => {
  context('calling on a node removes that node', () => {
    it('check works on a div', async () => {
      await createHTML(`<section><div id="target"><p>Content</p></div></section>`, (root) => {
        const div = root.querySelector('div#target') as HTMLDivElement;
        Assertions.assertEq('Expected to not be removed yet', `<div id="target"><p>Content</p></div>`, root.innerHTML);
        $(div).remove();
        Assertions.assertEq('Expected content to be removed', ``, root.innerHTML);
      });
    });
    it('check that the selector filters the node set', async () => {
      await createHTML(`<section><div class="target"></div><div class="target miss"></div><div class="target"></div></section>`, (root) => {
        const elm = $('div.target');
        Assertions.assertEq(
          'Expected to not be removed yet',
          `<div class="target"></div><div class="target miss"></div><div class="target"></div>`,
          root.innerHTML);
        elm.remove(':not(.miss)');
        Assertions.assertEq('Expected content to be removed', `<div class="target miss"></div>`, root.innerHTML);
      });
    });
  });
  context('calling on a node with a nested editor removes that editor', () => {
    it('check works without selector on normal editors', async () => {
      await createHTML(`<section><div id="target"><p>Before</p><textarea id="editor">&lt;p&gt;Content&lt;/p&gt;</textarea></div></section>`, async (root) => {
        const target = $('div#target');
        const elm = $('textarea#editor');
        const ed = (await elm.tinymce({ }))[0];
        try {
          Assertions.assertEq('Expected editor to contain content', `<p>Content</p>`, ed.getContent());
          target.remove();
          Assertions.assertEq('Expected editor to be destroyed', true, !!ed.destroyed);
          Assertions.assertEq('Expected content to be removed', ``, root.innerHTML);
        } finally {
          ed.destroy();
        }
      });
    });
    it('check works without selector on inline editors', async () => {
      await createHTML(`<section><div id="target"><p>Before</p><div id="editor"><p>Content</p></div></div></section>`, async (root) => {
        const target = $('div#target');
        const elm = $('div#editor');
        const ed = (await elm.tinymce({ inline: true }))[0];
        try {
          Assertions.assertStructure('Expected root to initially contain everything',
            ApproxStructure.fromHtml(`<section><div id="target"><p>Before</p><div id="editor"><p>Content</p></div></div></section>`),
            SugarElement.fromDom(root));
          Assertions.assertEq('Expected editor to contain content', `<p>Content</p>`, ed.getContent());
          target.remove();
          Assertions.assertEq('Expected editor to be destroyed', true, !!ed.destroyed);
          Assertions.assertEq('Expected all content to be removed', ``, root.innerHTML);
        } finally {
          ed.destroy();
        }
      });
    });
    it('check works with selector on normal editors', async () => {
      await createHTML(`<section>
      <div class="target"><textarea id="editor1">&lt;p&gt;Content&lt;/p&gt;</textarea></div>
      <div class="target miss"><textarea id="editor2">&lt;p&gt;Content&lt;/p&gt;</textarea></div>
      <div class="target"><textarea id="editor3">&lt;p&gt;Content&lt;/p&gt;</textarea></div>
      </section>`, async (root) => {
        const target = $('div.target');
        const eds: Editor[] = [];
        try {
          eds.push((await $('textarea#editor1').tinymce({ }))[0]);
          eds.push((await $('textarea#editor2').tinymce({ }))[0]);
          eds.push((await $('textarea#editor3').tinymce({ }))[0]);
          Assertions.assertEq('Expected editor 1 to contain content', `<p>Content</p>`, eds[0].getContent());
          Assertions.assertEq('Expected editor 2 to contain content', `<p>Content</p>`, eds[1].getContent());
          Assertions.assertEq('Expected editor 3 to contain content', `<p>Content</p>`, eds[2].getContent());
          target.remove(':not(.miss)');
          Assertions.assertEq('Expected editor 1 to be destroyed', true, !!eds[0].destroyed);
          Assertions.assertEq('Expected editor 2 to be existing', false, !!eds[1].destroyed);
          Assertions.assertEq('Expected editor 3 to be destroyed', true, !!eds[2].destroyed);
          Assertions.assertEq('Expected editor 2 to contain content', `<p>Content</p>`, eds[1].getContent());
          Assertions.assertPresence('Expected to contain a textarea', { textarea: 1 }, SugarElement.fromDom(root));
        } finally {
          for (const ed of eds) {
            ed.destroy();
          }
        }
      });
    });
    it('check works with selector on inline editors', async () => {
      await createHTML('<section>' +
      '<div class="target"><div id="editor1"><p>Content</p></div></div>' +
      '<div class="target miss"><div id="editor2"><p>Content</p></div></div>' +
      '<div class="target"><div id="editor3"><p>Content</p></div></div>' +
      '</section>', async (root) => {
        const target = $('div.target');
        const eds: Editor[] = [];
        try {
          eds.push((await $('div#editor1').tinymce({ inline: true }))[0]);
          eds.push((await $('div#editor2').tinymce({ inline: true }))[0]);
          eds.push((await $('div#editor3').tinymce({ inline: true }))[0]);
          Assertions.assertStructure('Expected root to initially contain everything',
            ApproxStructure.fromHtml('<section>' +
            '<div class="target"><div id="editor1"><p>Content</p></div></div>' +
            '<div class="target miss"><div id="editor2"><p>Content</p></div></div>' +
            '<div class="target"><div id="editor3"><p>Content</p></div></div>' +
            '</section>'),
            SugarElement.fromDom(root));
          Assertions.assertEq('Expected editor 1 to contain content', `<p>Content</p>`, eds[0].getContent());
          Assertions.assertEq('Expected editor 2 to contain content', `<p>Content</p>`, eds[1].getContent());
          Assertions.assertEq('Expected editor 3 to contain content', `<p>Content</p>`, eds[2].getContent());
          target.remove(':not(.miss)');
          Assertions.assertEq('Expected editor 1 to be destroyed', true, !!eds[0].destroyed);
          Assertions.assertEq('Expected editor 2 to be existing', false, !!eds[1].destroyed);
          Assertions.assertEq('Expected editor 3 to be destroyed', true, !!eds[2].destroyed);
          Assertions.assertEq('Expected editor 2 to contain content', `<p>Content</p>`, eds[1].getContent());
          Assertions.assertStructure('Expected root only contain one editor',
            ApproxStructure.fromHtml(`<section><div class="target miss"><div id="editor2"><p>Content</p></div></div></section>`),
            SugarElement.fromDom(root));
        } finally {
          for (const ed of eds) {
            ed.destroy();
          }
        }
      });
    });
  });
  context('calling on a node with a linked editor removes that editor', () => {
    it('check works without selector on normal editors', async () => {
      await createHTML(`<section><textarea id="editor">&lt;p&gt;Content&lt;/p&gt;</textarea></section>`, async (root) => {
        const elm = $('textarea#editor');
        const ed = (await elm.tinymce({ }))[0];
        try {
          Assertions.assertEq('Expected editor to contain content', `<p>Content</p>`, ed.getContent());
          elm.remove();
          Assertions.assertEq('Expected editor to be destroyed', true, !!ed.destroyed);
          Assertions.assertEq('Expected content to be removed', ``, root.innerHTML);
        } finally {
          ed.destroy();
        }
      });
    });
    it('check works without selector on inline editors', async () => {
      await createHTML(`<section><div id="editor"><p>Content</p></div></section>`, async (root) => {
        const elm = $('div#editor');
        const ed = (await elm.tinymce({ }))[0];
        try {
          Assertions.assertEq('Expected editor to contain content', `<p>Content</p>`, ed.getContent());
          elm.remove();
          Assertions.assertEq('Expected editor to be destroyed', true, !!ed.destroyed);
          Assertions.assertEq('Expected content to be removed', ``, root.innerHTML);
        } finally {
          ed.destroy();
        }
      });
    });
    it('check works with selector on normal editors', async () => {
      await createHTML(`<section class="container">
      <textarea id="editor1">&lt;p&gt;Content&lt;/p&gt;</textarea>
      <textarea id="editor2" class="miss">&lt;p&gt;Content&lt;/p&gt;</textarea>
      <textarea id="editor3">&lt;p&gt;Content&lt;/p&gt;</textarea>
      </section>`, async (root) => {
        const target = $('section.container textarea');
        const eds: Editor[] = [];
        try {
          eds.push((await $('textarea#editor1').tinymce({ }))[0]);
          eds.push((await $('textarea#editor2').tinymce({ }))[0]);
          eds.push((await $('textarea#editor3').tinymce({ }))[0]);
          Assertions.assertEq('Expected editor 1 to contain content', `<p>Content</p>`, eds[0].getContent());
          Assertions.assertEq('Expected editor 2 to contain content', `<p>Content</p>`, eds[1].getContent());
          Assertions.assertEq('Expected editor 3 to contain content', `<p>Content</p>`, eds[2].getContent());
          target.remove(':not(.miss)');
          Assertions.assertEq('Expected editor 1 to be destroyed', true, !!eds[0].destroyed);
          Assertions.assertEq('Expected editor 2 to be existing', false, !!eds[1].destroyed);
          Assertions.assertEq('Expected editor 3 to be destroyed', true, !!eds[2].destroyed);
          Assertions.assertEq('Expected editor 2 to contain content', `<p>Content</p>`, eds[1].getContent());
          Assertions.assertPresence('Expected to contain a textarea', { textarea: 1 }, SugarElement.fromDom(root));
        } finally {
          for (const ed of eds) {
            ed.destroy();
          }
        }
      });
    });
    it('check works with selector on inline editors', async () => {
      await createHTML('<section class="container">' +
      '<div id="editor1"><p>Content</p></div>' +
      '<div id="editor2"><p>Content</p></div>' +
      '<div id="editor3"><p>Content</p></div>' +
      '</section>', async (root) => {
        const target = $('section.container div');
        const eds: Editor[] = [];
        try {
          eds.push((await $('div#editor1').tinymce({ inline: true }))[0]);
          eds.push((await $('div#editor2').tinymce({ inline: true }))[0]);
          eds.push((await $('div#editor3').tinymce({ inline: true }))[0]);
          Assertions.assertStructure('Expected root to initially contain everything',
            ApproxStructure.fromHtml('<section class="container">' +
            '<div id="editor1"><p>Content</p></div>' +
            '<div id="editor2"><p>Content</p></div>' +
            '<div id="editor3"><p>Content</p></div>' +
            '</section>'),
            SugarElement.fromDom(root));
          Assertions.assertEq('Expected editor 1 to contain content', `<p>Content</p>`, eds[0].getContent());
          Assertions.assertEq('Expected editor 2 to contain content', `<p>Content</p>`, eds[1].getContent());
          Assertions.assertEq('Expected editor 3 to contain content', `<p>Content</p>`, eds[2].getContent());
          target.remove(':not(#editor2)');
          Assertions.assertEq('Expected editor 1 to be destroyed', true, !!eds[0].destroyed);
          Assertions.assertEq('Expected editor 2 to be existing', false, !!eds[1].destroyed);
          Assertions.assertEq('Expected editor 3 to be destroyed', true, !!eds[2].destroyed);
          Assertions.assertEq('Expected editor 2 to contain content', `<p>Content</p>`, eds[1].getContent());
          Assertions.assertStructure('Expected root only contain one editor',
            ApproxStructure.fromHtml(`<section class="container"><div id="editor2"><p>Content</p></div></section>`),
            SugarElement.fromDom(root));
        } finally {
          for (const ed of eds) {
            ed.destroy();
          }
        }
      });
    });
  });
});