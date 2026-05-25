import { Assertions } from '@ephox/agar';
import { describe, it } from '@ephox/bedrock-client';
import { getScriptSrc } from '../../../main/ts/Integration';

describe('ScriptSrcTest', () => {
  const aUrl = 'http://example.com/tinymce/tinymce.min.js';
  const aKey = 'abcdef0123456789';
  const aChannel = '5.4.2';

  it('returns default CDN URL for empty settings', () => {
    Assertions.assertEq('Test empty settings',
      'https://cdn.tiny.cloud/1/no-api-key/tinymce/8/tinymce.min.js',
      getScriptSrc({}));
  });

  it('uses "script_url" when provided', () => {
    Assertions.assertEq('Test "script_url"',
      aUrl, getScriptSrc({ script_url: aUrl }));
  });

  it('uses "channel" in the CDN URL', () => {
    Assertions.assertEq('Test "channel"',
      'https://cdn.tiny.cloud/1/no-api-key/tinymce/5.4.2/tinymce.min.js',
      getScriptSrc({ channel: aChannel }));
  });

  it('uses "api_key" in the CDN URL', () => {
    Assertions.assertEq('Test "api_key"',
      'https://cdn.tiny.cloud/1/abcdef0123456789/tinymce/8/tinymce.min.js',
      getScriptSrc({ api_key: aKey }));
  });

  it('uses both "api_key" and "channel" in the CDN URL', () => {
    Assertions.assertEq('Test "api_key" and "channel"',
      'https://cdn.tiny.cloud/1/abcdef0123456789/tinymce/5.4.2/tinymce.min.js',
      getScriptSrc({ channel: aChannel, api_key: aKey }));
  });

  it('"script_url" takes precedence over other options', () => {
    Assertions.assertEq('Test "script_url" with others',
      aUrl, getScriptSrc({ script_url: aUrl, channel: aChannel, api_key: aKey }));
  });
});