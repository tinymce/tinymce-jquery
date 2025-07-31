import { Assertions } from '@ephox/agar';
import { UnitTest } from '@ephox/bedrock-client';
import { getScriptSrc } from '../../../main/ts/Integration';

UnitTest.test('ScriptSrcTest', () => {
  const aUrl = 'http://example.com/tinymce/tinymce.min.js';
  const aKey = 'abcdef0123456789';
  const aChannel = '5.4.2';
  Assertions.assertEq('Test empty settings',
    'https://cdn.tiny.cloud/1/no-api-key/tinymce/8/tinymce.min.js',
    getScriptSrc({}));

  Assertions.assertEq('Test "script_url"',
    aUrl, getScriptSrc({ script_url: aUrl }));

  Assertions.assertEq('Test "channel"',
    'https://cdn.tiny.cloud/1/no-api-key/tinymce/5.4.2/tinymce.min.js',
    getScriptSrc({ channel: aChannel }));

  Assertions.assertEq('Test "api_key"',
    'https://cdn.tiny.cloud/1/abcdef0123456789/tinymce/8/tinymce.min.js',
    getScriptSrc({ api_key: aKey }));

  Assertions.assertEq('Test "api_key" and "channel"',
    'https://cdn.tiny.cloud/1/abcdef0123456789/tinymce/5.4.2/tinymce.min.js',
    getScriptSrc({ channel: aChannel, api_key: aKey }));

  Assertions.assertEq('Test "script_url" with others',
    aUrl, getScriptSrc({ script_url: aUrl, channel: aChannel, api_key: aKey }));
});