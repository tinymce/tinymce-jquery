import { Editor, RawEditorOptions, TinyMCE as TinyMCEGlobal } from 'tinymce';
import { getJquery } from './JQuery';
import { patchJQueryFunctions } from './Patch';
import { loadTinymce, getTinymceInstance } from './TinyMCE';

export interface RawEditorExtendedSettings extends RawEditorOptions {
  script_url?: string;
  channel?: string;
  api_key?: string;
  selector?: undefined;
  target?: undefined;
  script_loaded?: () => void;
  oninit?: string | AllInitFn;
}

declare global {
  interface JQuery<TElement = HTMLElement> extends Iterable<TElement> {
    tinymce(): Editor;
    tinymce(settings: RawEditorExtendedSettings): Promise<Editor[]>;
  }
}

type AllInitFn = (editors: Editor[]) => void;

export const getScriptSrc = (settings: RawEditorExtendedSettings): string => {
  if (typeof settings.script_url === 'string') {
    return settings.script_url;
  } else {
    const channel = typeof settings.channel === 'string' ? settings.channel : '5-stable';
    const apiKey = typeof settings.api_key === 'string' ? settings.api_key : 'no-api-key';
    return `https://cdn.tiny.cloud/1/${apiKey}/tinymce/${channel}/tinymce.min.js`;
  }
};

const getEditors = (tinymce: TinyMCEGlobal, self: JQuery<HTMLElement>): Editor[] => {
  const out: Editor[] = [];
  self.each((i, ele) => {
    out.push(tinymce.get(ele.id));
  });
  return out;
};

const resolveFunction = <F extends Function> (tiny: TinyMCEGlobal, fnOrStr: unknown): F | null => {
  if (typeof fnOrStr === 'string') {
    const func: unknown = tiny.resolve(fnOrStr);
    if (typeof func === 'function') {
      const scope = (fnOrStr.indexOf('.') === -1) ? tiny : tiny.resolve(fnOrStr.replace(/\.\w+$/, ''));
      return (func as F).bind(scope);
    }
  } else if (typeof fnOrStr === 'function') {
    return fnOrStr.bind(tiny);
  }
  return null;
};

let patchApplied = false;

const tinymceFn = function (this: JQuery<HTMLElement>, settings?: RawEditorExtendedSettings): Editor | undefined | Promise<Editor[]> {
  // No match then just ignore the call
  if (!this.length) {
    return !settings ? undefined : Promise.resolve([]);
  }

  // Get editor instance
  if (!settings) {
    return getTinymceInstance(this[0]) ?? undefined;
  }

  // Hide textarea to avoid flicker
  this.css('visibility', 'hidden');

  return new Promise<Editor[]>((resolve) => {
    // Load tinymce
    loadTinymce(getScriptSrc(settings), (tinymce, loadedFromProvidedUrl) => {
      // Execute callback after tinymce has been loaded and before the initialization occurs
      if (loadedFromProvidedUrl && settings.script_loaded) {
        settings.script_loaded();
      }
      // Apply patches to the jQuery object, only once
      if (!patchApplied) {
        patchApplied = true;
        patchJQueryFunctions(getJquery());
      }

      // track how many editors have initialized so we can run a callback
      let initCount = 0;
      const allInitCallback = resolveFunction<AllInitFn>(tinymce, settings.oninit);
      const allInitialized = () => {
        const editors = getEditors(tinymce, this);
        if (allInitCallback) {
          allInitCallback(editors);
        }
        resolve(editors);
      };

      // Create an editor instance for each matched node
      this.each((_i, elm) => {

        // Generate unique id for target element if needed
        if (!elm.id) {
          elm.id = tinymce.DOM.uniqueId();
        }

        // Only init the editor once
        if (tinymce.get(elm.id)) {
          initCount++;
          return;
        }

        const initInstanceCallback = (editor: Editor) => {
          this.css('visibility', '');
          initCount++;
          const origFn = settings.init_instance_callback;
          if (typeof origFn === 'function') {
            origFn.call(editor, editor);
          }
          if (initCount === this.length) {
            allInitialized();
          }
        };

        // Create editor instance and render it
        tinymce.init({
          ...settings,
          selector: undefined,
          target: elm,
          init_instance_callback: initInstanceCallback
        });

      }); // this.each

      if (initCount === this.length) {
        allInitialized();
      }

    }); // load tinymce
  });
};

export const setupIntegration = () => {
  const jq = getJquery();
  // Add :tinymce pseudo selector this will select elements that has been converted into editor instances
  // it's now possible to use things like $('*:tinymce') to get all TinyMCE bound elements.
  jq.expr.pseudos.tinymce = (e: Element) => !!getTinymceInstance(e);
  // Add a tinymce function for creating editors
  (jq.fn as any).tinymce = tinymceFn;
};