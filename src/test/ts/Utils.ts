
import { Waiter } from '@ephox/agar';
import { Insert, Remove, SugarBody, SugarElement } from '@ephox/sugar';
import { Editor } from 'tinymce';

export const createEditor = async (action: (targetElm: JQuery<HTMLElement>, editors: Editor) => void | Promise<void>) => {
  // TinyMCE must be in the document to work
  const ce = SugarElement.fromTag('textarea');
  Insert.append(SugarBody.body(), ce);
  const targetElm = $(ce.dom);
  const editors = await targetElm.tinymce({
    license_key: 'gpl',
    script_url: '/project/node_modules/tinymce/tinymce.js',
  });

  await Waiter.pTryUntil('Editor should be initialized', () => editors[0]?.initialized);

  const maybeAsync = action(targetElm, editors[0]);
  if (maybeAsync) {
    await maybeAsync;
  }
  editors[0].remove();
  await Waiter.pTryUntil('Editor should be removed', () => $(ce.dom).tinymce() === undefined);
  Remove.remove(ce);
};

export const createHTML = async (html: string, action: (root: HTMLElement) => void | Promise<void>) => {
  const ce = SugarElement.fromHtml<HTMLElement>(html);
  Insert.append(SugarBody.body(), ce);

  await Waiter.pTryUntil('Editor should be initialized', () => $(ce.dom)?.tinymce()?.initialized);

  const maybeAsync = action(ce.dom);
  if (maybeAsync) {
    await maybeAsync;
  }

  Remove.remove(ce);
};