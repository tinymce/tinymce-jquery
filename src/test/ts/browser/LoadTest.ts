import { Pipeline, Step, Waiter, Assertions } from '@ephox/agar';
import { SugarElement, SugarBody, Insert, Remove, SelectorFilter, Class } from '@ephox/sugar';
import { UnitTest } from '@ephox/bedrock-client';
import { setupIntegration } from '../../../main/ts/Integration';
import { Arr, Cell } from '@ephox/katamari';
import { Editor } from 'tinymce';

UnitTest.asynctest('LoadTest', (success, failure) => {
  // Note that bedrock uses jQuery so we don't need to load it
  setupIntegration();
  const seenSetup = Cell(false);
  const seenInit = Cell(false);
  let editorInstance: Editor;
  Pipeline.async('', [
    Step.sync(() => {
      // make an SugarElement for jQuery to target
      const ce = SugarElement.fromTag('div');
      Class.add(ce, 'test-editor');
      Insert.append(SugarBody.body(), ce);
    }),
    Step.sync(() => {
      // select the SugarElement we just created and use the jQuery extension to make tinymce
      $('div.test-editor').tinymce({
        setup: (_editor: Editor) => {
          seenSetup.set(true);
        },
        init_instance_callback: (editor: Editor) => {
          editorInstance = editor;
          seenInit.set(true);
        }
      }).catch((err) => {
        /* eslint-disable-next-line no-console */
        console.error('TinyMCE init failed', err);
      });
    }),
    Waiter.sTryUntilPredicate('Waiting for editor setup', () => seenSetup.get()),
    Waiter.sTryUntilPredicate('Waiting for editor init', () => seenInit.get()),
    Step.sync(() => {
      Assertions.assertEq('Test editor can be got from jQuery', editorInstance, $('div.test-editor').tinymce());
    }),
    Step.sync(() => {
      $('div.test-editor').html('<p>Hello world</p>');
    }),
    Step.sync(() => {
      Assertions.assertHtmlStructure('Check editor content', '<p>Hello world</p>', editorInstance.getContent());
    }),
    Step.sync(() => {
      // remove the editor with jQuery
      $('*:tinymce').remove();
    }),
    Step.sync(() => {
      Arr.map(SelectorFilter.all('div.test-editor'), Remove.remove);
    })
  ], success, failure);
});