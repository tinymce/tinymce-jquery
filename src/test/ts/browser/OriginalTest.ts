import { UnitTest } from '@ephox/bedrock-client';
import { SugarElement, SugarBody, Insert, Remove, SelectorFilter, Html, Class } from '@ephox/sugar';
import { Arr } from '@ephox/katamari';
import { LegacyUnit } from '@ephox/mcagar';
import { getTinymce } from '../../../main/ts/TinyMCE';
import { Pipeline } from '@ephox/agar';

UnitTest.asynctest('browser.tinymce.core.JqueryIntegrationTest', (success, failure) => {
  const suite = LegacyUnit.createSuite();

  const setup = () => {
    // make an SugarElement for jQuery to target
    const ce = SugarElement.fromTag('div');
    Class.add(ce, 'test-editor');
    Html.set(ce,
      '<textarea id="elm1"></textarea>' +
      '<textarea id="elm2"></textarea>' +
      '<textarea id="elm3">Textarea</textarea>'
    );
    Insert.append(SugarBody.body(), ce);
  };

  suite.asyncTest('Setup editors', (_, done) => {
    $(() => {
      $('#elm1,#elm2').tinymce({
        base_url: '/project/tinymce/js/tinymce',
        init_instance_callback: () => {
          const ed1 = getTinymce().get('elm1');
          const ed2 = getTinymce().get('elm2');

          // When both editors are initialized
          if (ed1 && ed1.initialized && ed2 && ed2.initialized) {
            done();
          }
        }
      });
    });
  });

  suite.test('Get editor instance', () => {
    LegacyUnit.equal($('#elm1').tinymce().id, 'elm1');
    LegacyUnit.equal($('#elm2').tinymce().id, 'elm2');
    LegacyUnit.equal($('#elm3').tinymce(), null);
  });

  suite.test('Get contents using jQuery', () => {
    getTinymce().get('elm1').setContent('<p>Editor 1</p>');

    LegacyUnit.equal($('#elm1').html(), '<p>Editor 1</p>');
    LegacyUnit.equal($('#elm1').val(), '<p>Editor 1</p>');
    LegacyUnit.equal($('#elm1').attr('value'), '<p>Editor 1</p>');
    LegacyUnit.equal($('#elm1').text(), 'Editor 1');
  });

  suite.test('Set contents using jQuery', () => {
    $('#elm1').html('Test 1');
    LegacyUnit.equal($('#elm1').html(), '<p>Test 1</p>');

    $('#elm1').val('Test 2');
    LegacyUnit.equal($('#elm1').html(), '<p>Test 2</p>');

    $('#elm1').text('Test 3');
    LegacyUnit.equal($('#elm1').html(), '<p>Test 3</p>');

    $('#elm1').attr('value', 'Test 4');
    LegacyUnit.equal($('#elm1').html(), '<p>Test 4</p>');
  });

  suite.test('append/prepend contents using jQuery', () => {
    getTinymce().get('elm1').setContent('<p>Editor 1</p>');

    $('#elm1').append('<p>Test 1</p>');
    LegacyUnit.equal($('#elm1').html(), '<p>Editor 1</p>\n<p>Test 1</p>');

    $('#elm1').prepend('<p>Test 2</p>');
    LegacyUnit.equal($('#elm1').html(), '<p>Test 2</p>\n<p>Editor 1</p>\n<p>Test 1</p>');
  });

  suite.test('Find using :tinymce selector', () => {
    LegacyUnit.equal($('textarea:tinymce').length, 2);
  });

  suite.test('Set contents using :tinymce selector', () => {
    $('textarea:tinymce').val('Test 1');
    LegacyUnit.equal($('#elm1').val(), '<p>Test 1</p>');
    LegacyUnit.equal($('#elm2').val(), '<p>Test 1</p>');
    LegacyUnit.equal($('#elm3').val(), 'Textarea');
  });

  suite.test('Get contents using :tinymce selector', () => {
    $('textarea:tinymce').val('Test get');
    LegacyUnit.equal($('textarea:tinymce').val(), '<p>Test get</p>');
  });

  suite.test('applyPatch is only called once', () => {
    const options = {};

    $('#elm1').tinymce(options);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const oldValFn = $.fn.val;

    $('#elm2').tinymce(options);

    // eslint-disable-next-line @typescript-eslint/unbound-method
    LegacyUnit.equal($.fn.val, oldValFn);
  });

  setup();
  Pipeline.async({}, suite.toSteps({}), () => {
    (getTinymce().EditorManager as any).remove();
    Arr.map(SelectorFilter.all('div.test-editor'), Remove.remove);
    success();
  }, failure);
});

