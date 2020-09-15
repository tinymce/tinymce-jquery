import { Editor } from 'tinymce';
import { getJquery } from './JQuery';
import { patchJQueryFunctions } from './Patch';
import { getTinymce, loadTinymce, getTinymceInstance } from './TinyMCE';

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
  if (typeof func === "string") {
    scope = (func.indexOf(".") === -1) ? null : getTinymce().resolve(func.replace(/\.\w+$/, ""));
    func = getTinymce().resolve(func) as Function;
  }
  // gather the list of editors
  const editors = self.map((i, elem) => getTinymce().get(elem.id))

  // Call the onInit function with the object
  func.apply(scope || getTinymce(), editors);
}

let patchApplied = false;

export const editor = function(this: JQuery<HTMLElement>, settings?: Record<string, any>) {
  const self = this;
  // No match then just ignore the call
  if (!self.length) {
    return self;
  }

  // Get editor instance
  if (!settings) {
    return getTinymceInstance(self[0]);
  }

  // Hide textarea to avoid flicker
  self.css('visibility', 'hidden'); 

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
    self.each(function (i, node) {

      let id = node.id;

      // Generate unique id for target element if needed
      if (!id) {
        node.id = id = getTinymce().DOM.uniqueId();
      }

      // Only init the editor once
      if (getTinymce().get(id)) {
        initCount++;
        return;
      }

      const init_instance_callback = (editor: Editor) => {
        self.css('visibility', '');
        initCount++;
        if (onInit && initCount === self.length) {
          fireOnInit(self, onInit);
        }
      };

      // Create editor instance and render it
      getTinymce().init({
        ...settings,
        selector: undefined,
        target: node,
        init_instance_callback
      });

    }); // self.each 

    if (onInit && initCount === self.length) {
      fireOnInit(self, onInit);
    }

  }); // load tinymce
  return self;
};