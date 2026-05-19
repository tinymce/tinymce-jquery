import { Assertions } from '@ephox/agar';
import { after, before, describe, it } from '@ephox/bedrock-client';
import { Class, Insert, Remove, SelectorFilter, SugarBody, SugarElement } from '@ephox/sugar';
import { setupIntegration } from '../../../main/ts/Integration';
import { Arr } from '@ephox/katamari';
import { Editor } from 'tinymce';

describe('LoadTest', () => {
  // Note that bedrock uses jQuery so we don't need to load it
  setupIntegration();

  let seenSetup = false;
  let editorInstance: Editor;

  before(async () => {
    const ce = SugarElement.fromTag('div');
    Class.add(ce, 'test-editor');
    Insert.append(SugarBody.body(), ce);

    await new Promise((resolve) => {
      $('div.test-editor').tinymce({
        init_instance_callback: (editor: Editor) => {
          seenSetup = true;
          editorInstance = editor;
          setTimeout(resolve, 100);
        }
      }).catch((err) => {
        /* eslint-disable-next-line no-console */
        console.error('TinyMCE init failed', err);
        resolve(undefined);
      });
    });
  });

  after(() => {
    $('*:tinymce').remove();
    Arr.map(SelectorFilter.all('div.test-editor'), Remove.remove);
  });

  it('calls setup callback', () => {
    Assertions.assertEq('setup was called', true, seenSetup);
  });

  it('can be retrieved from jQuery', () => {
    Assertions.assertEq('Test editor can be got from jQuery', editorInstance, $('div.test-editor').tinymce());
  });

  it('can set HTML content via jQuery', () => {
    $('div.test-editor').html('<p>Hello world</p>');
    Assertions.assertHtmlStructure('Check editor content', '<p>Hello world</p>', editorInstance.getContent());
  });
});
