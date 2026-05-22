import { Assertions } from '@ephox/agar';
import { after, before, describe, it } from '@ephox/bedrock-client';
import { Class, Insert, Remove, SelectorFilter, SugarBody, SugarElement } from '@ephox/sugar';
import { setupIntegration } from '../../../main/ts/Integration';
import { Arr } from '@ephox/katamari';
import { Editor } from 'tinymce';
import { removeTinymce } from '../Utils';

describe('LoadTest', () => {
  let editorInstance: Editor;

  before(async function () {
    this.timeout(5000); // Allow more time for loading TinyMCE
    // Note that bedrock uses jQuery so we don't need to load it
    setupIntegration();

    const ce = SugarElement.fromTag('div');
    Class.add(ce, 'test-editor');
    Insert.append(SugarBody.body(), ce);

    await new Promise<void>((resolve) => {
      $('div.test-editor').tinymce({
        license_key: 'gpl',
        script_url: '/project/node_modules/tinymce/tinymce.js',
        init_instance_callback: (editor: Editor) => {
          editorInstance = editor;
          resolve();
        }
      }).catch((err) => {
        /* eslint-disable-next-line no-console */
        console.error('TinyMCE init failed', err);
        resolve();
      });
    });
  });

  after(() => {
    $('*:tinymce').remove();
    Arr.map(SelectorFilter.all('div.test-editor'), Remove.remove);
    removeTinymce();
  });

  it('can be retrieved from jQuery', () => {
    Assertions.assertEq('Test editor can be got from jQuery', editorInstance, $('div.test-editor').tinymce());
  });

  it('can set HTML content via jQuery', () => {
    $('div.test-editor').html('<p>Hello world</p>');
    Assertions.assertHtmlStructure('Check editor content', '<p>Hello world</p>', editorInstance.getContent());
  });
});
