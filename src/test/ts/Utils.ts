
import { Insert, Remove, SugarBody, SugarElement } from '@ephox/sugar';
import { Editor } from 'tinymce';

export const createEditor = async (action: (targetElm: JQuery<HTMLElement>, editors: Editor) => void | Promise<void>) => {
  // TinyMCE must be in the document to work
  const ce = SugarElement.fromTag('textarea');
  Insert.append(SugarBody.body(), ce);
  try {
    const targetElm = $(ce.dom);
    const editors = await targetElm.tinymce({ });
    try {
      const maybeAsync = action(targetElm, editors[0]);
      if (maybeAsync) {
        await maybeAsync;
      }
    } finally {
      editors[0].remove();
    }
  } finally {
    Remove.remove(ce);
  }
};

export const createHTML = async (html: string, action: (root: HTMLElement) => void | Promise<void>) => {
  const ce = SugarElement.fromHtml<HTMLElement>(html);
  Insert.append(SugarBody.body(), ce);
  try {
    const maybeAsync = action(ce.dom);
    if (maybeAsync) {
      await maybeAsync;
    }
  } finally {
    Remove.remove(ce);
  }
};