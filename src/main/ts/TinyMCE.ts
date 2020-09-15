import { Global } from "./Global";

type TinymceGlobal = typeof import("tinymce");

const tinymce = (): (TinymceGlobal | null) => Global.tinymce ?? null;

export const hasTinymce = () => !!(tinymce());

export const getTinymce = (): TinymceGlobal => {
  const tiny = tinymce();
  if (tiny != null) {
    return tiny;
  }
  throw new Error("Expected global tinymce");
}

// Returns tinymce instance for the specified element or null if it wasn't found
export const getTinymceInstance = function (element: Element) {
  let ed = null;

  if (element && element.id && hasTinymce()) {
    ed = getTinymce().get(element.id);
  }

  return ed;
};

type TinymceCallback = (tinymce: TinymceGlobal, loadedScript: boolean) => void;

let lazyLoading = 0;
let callbacks: TinymceCallback[] = [];

export const loadTinymce = (url: string, callback: TinymceCallback) => {
    // Load TinyMCE on demand, if we need to
    if (!tinymce() && !lazyLoading) {
      lazyLoading = 1;

      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.onload = function (e: Event) {
        if (lazyLoading !== 2 && (e.type == 'load')) {
          lazyLoading = 2;
          const tiny = getTinymce();
          callback(tiny, true);
          for (let i = 0; i < callbacks.length; i++) {
            callbacks[i](tiny, false);
          }
        }
      };
      script.src = url;
      document.body.appendChild(script);
    } else {
      // Delay the init call until tinymce is loaded
      if (lazyLoading === 1) {
        callbacks.push(callback);
      } else {
        callback(getTinymce(), false);
      }
    }
}