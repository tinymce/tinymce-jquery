import { Pipeline, Step, Waiter, Assertions } from '@ephox/agar';
import { Element, Attr, Body, Insert, Remove, SelectorFilter, Class, Head } from '@ephox/sugar';
import { UnitTest } from '@ephox/bedrock-client';
import Editor from '../../../main/ts/Editor'
import { Arr, Cell } from '@ephox/katamari';

UnitTest.asynctest('LoadTest', (success, failure) => {
  // Note that bedrock uses JQuery so we don't need to load it
  Editor();
  let seenSetup = Cell(false);
  let seenInit = Cell(false);
  let editorInstance: any;
  Pipeline.async('', [
    Step.sync(() => {
      // make an element for JQuery to target
      const ce = Element.fromTag('div');
      Class.add(ce, 'test-editor');
      Insert.append(Body.body(), ce);
    }),
    Step.sync(() => {
      // select the element we just created and use the JQuery extension to make tinymce
      $('div.test-editor').tinymce({
        setup: (editor) => {
          seenSetup.set(true);
        },
        init_instance_callback: (editor) => {
          editorInstance = editor;
          seenInit.set(true);
        }
      })
    }),
    Waiter.sTryUntilPredicate('Waiting for editor setup', () => seenSetup.get()),
    Waiter.sTryUntilPredicate('Waiting for editor init', () => seenInit.get()),
    Step.sync(() => {
      Assertions.assertEq('Test editor can be got from JQuery', editorInstance, $('div.test-editor').tinymce());
    }),
    Step.sync(() => {
      $('div.test-editor').html('<p>Hello world</p>');
    }),
    Step.sync(() => {
      Assertions.assertHtmlStructure('', '<p>Hello world</p>', editorInstance.getContent());
    }),
    Step.sync(() => {
      // remove the editor with JQuery
      $('*:tinymce').remove();
    }),
    Step.sync(() => {
      Arr.map(SelectorFilter.all('div.test-editor'), Remove.remove);
    })
  ], success, failure);
});