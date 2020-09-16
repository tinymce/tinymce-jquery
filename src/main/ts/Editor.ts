import { Editor } from 'tinymce';
import { getJquery } from './JQuery';
import { patchJQueryFunctions } from './Patch';
import { getTinymce, loadTinymce, getTinymceInstance } from './TinyMCE';

declare global {
  interface JQuery<TElement = HTMLElement> extends Iterable<TElement> {
    tinymce(): Editor;
    tinymce(settings: Record<string, any>): this;
  }
}

const getScriptSrc = (settings: Record<string, any>): string => {
  if (typeof settings.script_url === 'string') {
    return settings.script_url;
  } else {
    const channel = typeof settings.channel === 'string' ? settings.channel : '5-stable';
    const apiKey = typeof settings.api_key === 'string' ? settings.api_key : 'no-api-key';
    return `https://cdn.tiny.cloud/1/${apiKey}/tinymce/${channel}/tinymce.min.js`;
  }
};

const fireOnInit = (self: JQuery<HTMLElement>, onInit: Function | string) => {
  // Fire the onInit event when all editors are initialized
  let func = onInit;
  let scope = null;
  if (typeof func === 'string') {
    scope = (func.indexOf('.') === -1) ? null : getTinymce().resolve(func.replace(/\.\w+$/, ''));
    func = getTinymce().resolve(func) as Function;
  }
  // gather the list of editors
  const editors = self.map((i, elem) => getTinymce().get(elem.id));

  // Call the onInit function with the object
  func.apply(scope || getTinymce(), editors);
};

let patchApplied = false;

const tinymceFn = function (this: JQuery<HTMLElement>, settings?: Record<string, any>) {
  // No match then just ignore the call
  if (!this.length) {
    return this;
  }

  // Get editor instance
  if (!settings) {
    return getTinymceInstance(this[0]);
  }

  // Hide textarea to avoid flicker
  this.css('visibility', 'hidden');

  // Load tinymce
  loadTinymce(getScriptSrc(settings), (tinymce, loadedScript) => {
    // Execute callback after tinymce has been loaded and before the initialization occurs
    if (loadedScript && settings.script_loaded) {
      settings.script_loaded();
    }
    // Apply patches to the jQuery object, only once
    if (!patchApplied) {
      patchApplied = true;
      patchJQueryFunctions(getJquery());
    }

    const onInit = settings.oninit;
    let initCount = 0;
    // Create an editor instance for each matched node
    this.each((i, node) => {

      let id = node.id;

      // Generate unique id for target element if needed
      if (!id) {
        node.id = id = tinymce.DOM.uniqueId();
      }

      // Only init the editor once
      if (tinymce.get(id)) {
        initCount++;
        return;
      }

      const initCallback = (editor: Editor) => {
        this.css('visibility', '');
        initCount++;
        const init: Function = settings.init_instance_callback;
        if (typeof init === 'function') {
          init.call(editor, editor);
        }
        if (onInit && initCount === this.length) {
          fireOnInit(this, onInit);
        }
      };

      // Create editor instance and render it
      getTinymce().init({
        ...settings,
        'selector': undefined,
        'target': node,
        'init_instance_callback': initCallback
      });

    }); // this.each

    if (onInit && initCount === this.length) {
      fireOnInit(this, onInit);
    }

  }); // load tinymce
  return this;
};

export default function () {
  const jq = getJquery();
  // Add :tinymce pseudo selector this will select elements that has been converted into editor instances
  // it's now possible to use things like $('*:tinymce') to get all TinyMCE bound elements.
  jq.expr.pseudos.tinymce = (e: Element) => !!getTinymceInstance(e);
  // Add a tinymce function for creating editors
  (jq.fn as any).tinymce = tinymceFn;
};