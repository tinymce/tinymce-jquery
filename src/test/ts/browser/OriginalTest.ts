import { Assertions } from '@ephox/agar';
import { after, before, describe, it } from '@ephox/bedrock-client';
import { Arr } from '@ephox/katamari';
import { Class, Html, Insert, Remove, SelectorFilter, SugarBody, SugarElement } from '@ephox/sugar';
import { getTinymce } from '../../../main/ts/TinyMCE';
import { setupIntegration } from 'src/main/ts/Integration';

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

describe('OriginalTest', () => {
  before(async function () {
    this.timeout(5000); // Allow more time for loading TinyMCE

    setupIntegration();
    setup();

    await new Promise<void>((resolve) => {
      $('#elm1,#elm2').tinymce({
        script_url: '/project/node_modules/tinymce/tinymce.js',
        init_instance_callback: () => {
          const ed1 = getTinymce().get('elm1');
          const ed2 = getTinymce().get('elm2');

          if (ed1 && ed1.initialized && ed2 && ed2.initialized) {
            setTimeout(resolve, 100);
          }
        }
      }).catch((err) => {
        /* eslint-disable-next-line no-console */
        console.error('TinyMCE init failed', err);
        resolve();
      });
    });
  });

  after(() => {
    (getTinymce().EditorManager as any).remove();
    Arr.map(SelectorFilter.all('div.test-editor'), Remove.remove);
  });

  it('Get editor instance', () => {
    Assertions.assertEq('elm1 editor id', 'elm1', $('#elm1').tinymce()?.id);
    Assertions.assertEq('elm2 editor id', 'elm2', $('#elm2').tinymce()?.id);
    Assertions.assertEq('elm3 has no editor', undefined, $('#elm3').tinymce());
  });

  it('Get contents using jQuery', () => {
    getTinymce().get('elm1')?.setContent('<p>Editor 1</p>');
    Assertions.assertEq('html()', '<p>Editor 1</p>', $('#elm1').html());
    Assertions.assertEq('val()', '<p>Editor 1</p>', $('#elm1').val());
    Assertions.assertEq('attr(value)', '<p>Editor 1</p>', $('#elm1').attr('value'));
    Assertions.assertEq('text()', 'Editor 1', $('#elm1').text());
  });

  it('Set contents using jQuery', () => {
    $('#elm1').html('Test 1');
    Assertions.assertEq('html() after html()', '<p>Test 1</p>', $('#elm1').html());

    $('#elm1').val('Test 2');
    Assertions.assertEq('html() after val()', '<p>Test 2</p>', $('#elm1').html());

    $('#elm1').text('Test 3');
    Assertions.assertEq('html() after text()', '<p>Test 3</p>', $('#elm1').html());

    $('#elm1').attr('value', 'Test 4');
    Assertions.assertEq('html() after attr()', '<p>Test 4</p>', $('#elm1').html());
  });

  it('append/prepend contents using jQuery', () => {
    getTinymce().get('elm1')?.setContent('<p>Editor 1</p>');

    $('#elm1').append('<p>Test 1</p>');
    Assertions.assertEq('after append', '<p>Editor 1</p>\n<p>Test 1</p>', $('#elm1').html());

    $('#elm1').prepend('<p>Test 2</p>');
    Assertions.assertEq('after prepend', '<p>Test 2</p>\n<p>Editor 1</p>\n<p>Test 1</p>', $('#elm1').html());
  });

  it('Find using :tinymce selector', () => {
    Assertions.assertEq(':tinymce selector length', 2, $('textarea:tinymce').length);
  });

  it('Set contents using :tinymce selector', () => {
    $('textarea:tinymce').val('Test 1');
    Assertions.assertEq('elm1 val', '<p>Test 1</p>', $('#elm1').val());
    Assertions.assertEq('elm2 val', '<p>Test 1</p>', $('#elm2').val());
    Assertions.assertEq('elm3 val', 'Textarea', $('#elm3').val());
  });

  it('Get contents using :tinymce selector', () => {
    $('textarea:tinymce').val('Test get');
    Assertions.assertEq('val via :tinymce selector', '<p>Test get</p>', $('textarea:tinymce').val());
  });

  it('applyPatch is only called once', () => {
    const options = {};

    $('#elm1').tinymce(options).catch((err) => {
      /* eslint-disable-next-line no-console */
      console.error('TinyMCE init failed', err);
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const oldValFn = $.fn.val;

    $('#elm2').tinymce(options).catch((err) => {
      /* eslint-disable-next-line no-console */
      console.error('TinyMCE init failed', err);
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    Assertions.assertEq('val fn unchanged after second init', oldValFn, $.fn.val);
  });
});
