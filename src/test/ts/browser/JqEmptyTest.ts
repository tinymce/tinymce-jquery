/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @tinymce/prefer-fun */
import { ApproxStructure, Assertions } from '@ephox/agar';
import { context, describe, it } from '@ephox/bedrock-client';
import { SugarElement } from '@ephox/sugar';
import { Editor } from 'tinymce';
import { setupIntegration } from '../../../main/ts/Integration';
import { createEditor, createHTML } from '../Utils';

setupIntegration();

describe('Check jQuery\'s `.empty()` function', () => {
  context('calling on a node with content removes that content', () => {
    it('check empty works on a div', () => {
      const div = document.createElement('div');
      const p1 = document.createElement('p');
      p1.appendChild(document.createTextNode('Hello'));
      const p2 = document.createElement('p');
      p2.appendChild(document.createTextNode('World'));
      div.appendChild(p1);
      div.appendChild(p2);
      Assertions.assertEq('Expected div to have content', `<p>Hello</p><p>World</p>`, div.innerHTML);
      $(div).empty();
      Assertions.assertEq('Expected div to have no content', ``, div.innerHTML);
    });
    it('check empty works on a normal editor with content', async () => {
      await createEditor((elm, ed) => {
        ed.setContent('<p>Hello</p><p>World</p>');
        Assertions.assertEq('Expected editor to have content', `<p>Hello</p>\n<p>World</p>`, ed.getContent());
        elm.empty();
        Assertions.assertEq('Expected editor to not have content', ``, ed.getContent());
        Assertions.assertEq('Expected editor to not be destroyed', false, !!ed.destroyed);
        Assertions.assertEq('Expected editor to still be linked to elm', ed, elm.tinymce());
      });
    });
    it('check empty works on a inline editor with content', async () => {
      await createHTML(`<section><div id="editor"><p>Hello</p><p>World</p></div></section>`, async (root) => {
        const elm = $('div#editor');
        const ed = (await elm.tinymce({ inline: true }))[0];
        try {
          Assertions.assertEq('Expected editor to have content', `<p>Hello</p>\n<p>World</p>`, ed.getContent());
          elm.empty();
          Assertions.assertEq('Expected editor to not have content', ``, ed.getContent());
          Assertions.assertEq('Expected editor to not be destroyed', false, !!ed.destroyed);
          Assertions.assertEq('Expected editor to still be linked to elm', ed, elm.tinymce());
          Assertions.assertStructure('Expected root to still contain the editor node',
            ApproxStructure.fromHtml(`<section><div id="editor"></div></section>`), SugarElement.fromDom(root));
        } finally {
          ed.destroy();
        }
      });
    });
  });
  context('calling on a node with a nested editor removes that editor', () => {
    it('check empty removes a single normal editor', async () => {
      // eslint-disable-next-line max-len
      await createHTML(`<section><div id="container"><p>Before</p><div><textarea id="editor">&lt;p&gt;Hello&lt;/p&gt;&lt;p&gt;World&lt;/p&gt;</textarea></div><p>After</p></div><p>Extra</p></section>`, async (root) => {
        const edElm = $('textarea#editor');
        const ed = (await edElm.tinymce({ }))[0];
        try {
          Assertions.assertEq('Expected editor to have content', `<p>Hello</p>\n<p>World</p>`, ed.getContent());
          const container = $('div#container');
          container.empty();
          Assertions.assertEq('Expected editor to be destroyed', true, !!ed.destroyed);
          Assertions.assertStructure('Expected root to still contain the container',
            ApproxStructure.fromHtml(`<section><div id="container"></div><p>Extra</p></section>`), SugarElement.fromDom(root));
        } finally {
          ed.destroy();
        }
      });
    });
    it('check empty removes a single inline editor', async () => {
      // eslint-disable-next-line max-len
      await createHTML(`<section><div id="container"><p>Before</p><div><div id="editor"><p>Hello</p><p>World</p></div></div><p>After</p></div><p>Extra</p></section>`, async (root) => {
        const edElm = $('div#editor');
        const ed = (await edElm.tinymce({ inline: true }))[0];
        try {
          Assertions.assertEq('Expected editor to have content', `<p>Hello</p>\n<p>World</p>`, ed.getContent());
          const container = $('div#container');
          container.empty();
          Assertions.assertEq('Expected editor to be destroyed', true, !!ed.destroyed);
          Assertions.assertStructure('Expected root to still contain the container',
            ApproxStructure.fromHtml(`<section><div id="container"></div><p>Extra</p></section>`), SugarElement.fromDom(root));
        } finally {
          ed.destroy();
        }
      });
    });
    it('check empty removes multiple editors', async () => {
      await createHTML(
        `<section><p>Before</p><div id="container">
          <p>Text1</p>
          <div class="editor">
            <p>Content1</p>
            <p>Content2</p>
          </div>
          <p>Text2</p>
          <div>
            <textarea class="editor">
              &lt;p&gt;Content1&lt;/p&gt;
              &lt;p&gt;Content2&lt;/p&gt;
            </textarea>
          </div>
          <p>Text3</p>
          <div class="editor">
            <p>Content1</p>
            <p>Content2</p>
          </div>
          <p>Text4</p>
        </div><p>After</p></section>`,
        async (root) => {
          const inline = $('div.editor');
          const normal = $('textarea.editor');
          const eds: Editor[] = [];
          try {
            eds.push(...await inline.tinymce({ inline: true }));
            eds.push(...await normal.tinymce({ }));
            for (let i = 0; i < eds.length; i++) {
              Assertions.assertEq(`Expected editor ${i} to have content`, `<p>Content1</p>\n<p>Content2</p>`, eds[i].getContent());
            }
            const container = $('div#container');
            container.empty();
            for (let i = 0; i < eds.length; i++) {
              Assertions.assertEq(`Expected editor ${i} to be destroyed`, true, !!eds[i].destroyed);
            }
            Assertions.assertStructure('Expected root to still contain the container',
              ApproxStructure.fromHtml(`<section><p>Before</p><div id="container"></div><p>After</p></section>`),
              SugarElement.fromDom(root));
          } finally {
            for (const ed of eds) {
              ed.destroy();
            }
          }
        }
      );
    });
  });
  context('editors outside of the emptied element are not removed', () => {
    it('check normal editors before and after are left alone', async () => {
      // eslint-disable-next-line max-len
      await createHTML(`<section><textarea class="editor">&lt;p&gt;Editor Content&lt;/p&gt;</textarea><div id="container"><p>Container Content</p></div><textarea class="editor">&lt;p&gt;Editor Content&lt;/p&gt;</textarea></section>`, async () => {
        const eds = await $('textarea.editor').tinymce({ });
        try {
          for (let i = 0; i < eds.length; i++) {
            Assertions.assertEq(`Expected editor ${i} to have content`, `<p>Editor Content</p>`, eds[i].getContent());
          }
          const container = $('div#container');
          container.empty();
          for (let i = 0; i < eds.length; i++) {
            Assertions.assertEq(`Expected editor ${i} to not be destroyed`, false, !!eds[i].destroyed);
          }
          for (let i = 0; i < eds.length; i++) {
            Assertions.assertEq(`Expected editor ${i} to still have content`, `<p>Editor Content</p>`, eds[i].getContent());
          }
        } finally {
          for (const ed of eds) {
            ed.destroy();
          }
        }
      });
    });
    it('check inline editors before and after are left alone', async () => {
      // eslint-disable-next-line max-len
      await createHTML(`<section><div class="editor"><p>Editor Content</p></div><div id="container"><p>Container Content</p></div><div class="editor"><p>Editor Content</p></div></section>`, async () => {
        const eds = await $('div.editor').tinymce({ inline: true });
        try {
          for (let i = 0; i < eds.length; i++) {
            Assertions.assertEq(`Expected editor ${i} to have content`, `<p>Editor Content</p>`, eds[i].getContent());
          }
          const container = $('div#container');
          container.empty();
          for (let i = 0; i < eds.length; i++) {
            Assertions.assertEq(`Expected editor ${i} to not be destroyed`, false, !!eds[i].destroyed);
          }
          for (let i = 0; i < eds.length; i++) {
            Assertions.assertEq(`Expected editor ${i} to still have content`, `<p>Editor Content</p>`, eds[i].getContent());
          }
        } finally {
          for (const ed of eds) {
            ed.destroy();
          }
        }
      });
    });
  });
});